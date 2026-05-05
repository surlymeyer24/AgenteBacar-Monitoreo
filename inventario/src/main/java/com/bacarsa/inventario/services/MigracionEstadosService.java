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

    public MigracionEstadosService(ComputadoraRepository computadoraRepository,
            CamaraRepository camaraRepository) {
        this.computadoraRepository = computadoraRepository;
        this.camaraRepository = camaraRepository;
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
                computadoraRepository.cambiarEstado(pc.getUuid(), estado, m);
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
}
