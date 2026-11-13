package com.bacarsa.inventario.services;

import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MigracionEstadoMasivoResultDTO;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class MigracionEstadosService {

    private static final int MAX_FALLOS_EN_RESPUESTA = 25;

    private final ComputadoraRepository computadoraRepository;
    private final CamaraRepository camaraRepository;
    private final ComputadoraHistorialService computadoraHistorialService;

    public MigracionEstadosService(ComputadoraRepository computadoraRepository,
            CamaraRepository camaraRepository,
            ComputadoraHistorialService computadoraHistorialService) {
        this.computadoraRepository = computadoraRepository;
        this.camaraRepository = camaraRepository;
        this.computadoraHistorialService = computadoraHistorialService;
    }

    /**
     * Pone estado {@link EstadoOperativo#ASIGNADA} en todas las computadoras y cámaras.
     * Omite las que ya tienen ese estado (mismo nombre) para no duplicar historial.
     */
    public MigracionEstadoMasivoResultDTO marcarTodasAsignada(String motivo)
            throws ExecutionException, InterruptedException {
        String m = (motivo == null || motivo.isBlank())
                ? "Migración masiva: normalización a estado Asignada"
                : motivo.trim();

        Estado estado = new Estado();
        estado.setNombre(EstadoOperativo.ASIGNADA.getNombre());
        estado.setDescripcion(EstadoOperativo.ASIGNADA.getDescripcion());

        MigracionEstadoMasivoResultDTO out = new MigracionEstadoMasivoResultDTO();

        for (Computadora pc : computadoraRepository.findAll()) {
            if (pc.getUuid() == null || pc.getUuid().isBlank()) {
                agregarFallo(out, "computadora sin UUID (revisá el documento en Firestore)");
                continue;
            }
            if (yaEsAsignada(pc.getEstadoActual())) {
                out.setComputadorasOmitidas(out.getComputadorasOmitidas() + 1);
                continue;
            }
            try {
                computadoraRepository.cambiarEstado(pc.getUuid(), estado, m, null, null);
                out.setComputadorasActualizadas(out.getComputadorasActualizadas() + 1);
            } catch (Exception e) {
                agregarFallo(out, "computadora " + pc.getUuid() + ": " + e.getMessage());
            }
        }

        for (Camara cam : camaraRepository.findAll()) {
            if (cam.getId() == null || cam.getId().isBlank()) {
                agregarFallo(out, "cámara sin id");
                continue;
            }
            if (yaEsAsignada(cam.getEstadoActual())) {
                out.setCamarasOmitidas(out.getCamarasOmitidas() + 1);
                continue;
            }
            try {
                camaraRepository.cambiarEstado(cam.getId(), estado, m);
                out.setCamarasActualizadas(out.getCamarasActualizadas() + 1);
            } catch (Exception e) {
                agregarFallo(out, "cámara " + cam.getId() + ": " + e.getMessage());
            }
        }

        return out;
    }

    private static boolean yaEsAsignada(Estado actual) {
        if (actual == null || actual.getNombre() == null) {
            return false;
        }
        return EstadoOperativo.ASIGNADA.getNombre().equalsIgnoreCase(actual.getNombre().trim());
    }

    private static void agregarFallo(MigracionEstadoMasivoResultDTO out, String msg) {
        if (out.getFallos().size() >= MAX_FALLOS_EN_RESPUESTA) {
            return;
        }
        out.getFallos().add(msg);
    }

    /**
     * Normaliza a estado {@link EstadoOperativo#ASIGNADA} todas las computadoras que actualmente
     * están en "Sin Asignar" pero tienen un responsable asignado o están ubicadas en un área operativa
     * (fuera de depósito/stock).
     */
    public MigracionEstadoMasivoResultDTO normalizarAsignacionesPcs(String motivo)
            throws ExecutionException, InterruptedException {
        String m = (motivo == null || motivo.isBlank())
                ? "Normalización masiva: equipo con responsable o área asignada"
                : motivo.trim();

        MigracionEstadoMasivoResultDTO out = new MigracionEstadoMasivoResultDTO();

        for (Computadora pc : computadoraRepository.findAllSinCache()) {
            if (pc.getUuid() == null || pc.getUuid().isBlank()) {
                agregarFallo(out, "computadora sin UUID");
                continue;
            }
            Estado estadoActual = pc.getEstadoActual();
            String nombreEstado = estadoActual != null ? estadoActual.getNombre() : null;

            if (yaEsAsignada(estadoActual)) {
                out.setComputadorasOmitidas(out.getComputadorasOmitidas() + 1);
                continue;
            }
            if (nombreEstado != null) {
                String u = nombreEstado.trim().toUpperCase(java.util.Locale.ROOT);
                if (u.contains("BAJA") || u.contains("MANTENIMIENTO")) {
                    out.setComputadorasOmitidas(out.getComputadorasOmitidas() + 1);
                    continue;
                }
            }

            String respInv = pc.getResponsableInventario();
            String ubi = pc.getUbicacion() != null ? pc.getUbicacion().name() : null;
            String userActual = com.bacarsa.inventario.util.UsuarioSesionHelper.limpiar(pc.getUsuarioActual());
            boolean enDep = Boolean.TRUE.equals(pc.getEnDeposito());

            boolean tieneResp = respInv != null && !respInv.isBlank() && !com.bacarsa.inventario.util.UsuarioSesionHelper.esUsuarioSistema(respInv);
            boolean ubicacionValida = ubi != null && !ubi.isBlank()
                    && !"DEPOSITO".equalsIgnoreCase(ubi.trim())
                    && !"STOCK".equalsIgnoreCase(ubi.trim())
                    && !enDep;
            boolean tieneUserSesionValido = userActual != null && !userActual.isBlank() && !com.bacarsa.inventario.util.UsuarioSesionHelper.esUsuarioSistema(userActual);

            boolean debeEstarAsignada = tieneResp || ubicacionValida || (tieneUserSesionValido && ubicacionValida);

            if (debeEstarAsignada) {
                try {
                    java.util.Map<String, Object> ficha = new java.util.LinkedHashMap<>();
                    if (!tieneResp && tieneUserSesionValido) {
                        ficha.put("responsableInventario", userActual);
                    }
                    if (pc.getAsignacionTipo() != null) {
                        ficha.put("asignacionTipo", pc.getAsignacionTipo());
                    } else if (tieneResp || tieneUserSesionValido) {
                        ficha.put("asignacionTipo", "PERSONA");
                    } else if (ubicacionValida) {
                        ficha.put("asignacionTipo", "AREA");
                    }
                    computadoraHistorialService.cambiarEstado(pc.getUuid(), "ASIGNADA", m, ficha, "SISTEMA");
                    out.setComputadorasActualizadas(out.getComputadorasActualizadas() + 1);
                } catch (Exception e) {
                    agregarFallo(out, "computadora " + pc.getUuid() + ": " + e.getMessage());
                }
            } else {
                out.setComputadorasOmitidas(out.getComputadorasOmitidas() + 1);
            }
        }
        return out;
    }

}
