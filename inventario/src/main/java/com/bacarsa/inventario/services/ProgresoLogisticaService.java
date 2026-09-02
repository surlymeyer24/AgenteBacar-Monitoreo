package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.dto.EtiquetaQrDetalleDTO;
import com.bacarsa.inventario.dto.EtiquetaQrItemDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaResumenDTO;
import com.bacarsa.inventario.dto.ResultadoProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.dto.UsuarioAuditoriaDTO;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.ProgresoLogisticaRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class ProgresoLogisticaService {

    private static final Set<String> FASES_VALIDAS = Set.of("etiquetado", "embalado", "destino");
    private static final int MAX_ITEMS_POR_PUESTO = 200;
    private static final int MAX_PUESTOS_MASIVO = 200;

    private final ProgresoLogisticaRepository progresoRepository;
    private final EtiquetaQrService etiquetaQrService;
    private final UsuarioRepository usuarioRepository;

    public ProgresoLogisticaService(
            ProgresoLogisticaRepository progresoRepository,
            EtiquetaQrService etiquetaQrService,
            UsuarioRepository usuarioRepository) {
        this.progresoRepository = progresoRepository;
        this.etiquetaQrService = etiquetaQrService;
        this.usuarioRepository = usuarioRepository;
    }

    public Map<String, ProgresoLogisticaResumenDTO> listarResumen()
            throws ExecutionException, InterruptedException {
        return progresoRepository.findAllResumen();
    }

    public ProgresoLogisticaDTO obtener(String uuid)
            throws ExecutionException, InterruptedException {
        if (!etiquetaQrService.existeUuid(uuid)) {
            return null;
        }
        return progresoRepository.findByUuid(uuid);
    }

    public ProgresoLogisticaDTO actualizar(
            String uuid,
            ActualizarProgresoLogisticaDTO request,
            String uid)
            throws ExecutionException, InterruptedException {
        EtiquetaQrDetalleDTO ficha = etiquetaQrService.obtenerPorUuid(uuid);
        if (ficha == null) {
            return null;
        }
        aplicarCambio(
                uuid,
                ficha,
                validarFase(request.getFase()),
                limpiarIds(request.getItemIds()),
                Boolean.TRUE.equals(request.getCompletado()),
                obtenerActor(uid));
        return progresoRepository.findByUuid(uuid);
    }

    public ResultadoProgresoLogisticaMasivoDTO actualizarMasivo(
            ActualizarProgresoLogisticaMasivoDTO request,
            String uid)
            throws ExecutionException, InterruptedException {
        List<String> uuids = limpiarIds(request.getUuids());
        if (uuids.size() > MAX_PUESTOS_MASIVO) {
            throw new IllegalArgumentException(
                    "No se pueden actualizar más de " + MAX_PUESTOS_MASIVO + " puestos a la vez.");
        }

        List<String> fases = limpiarIds(request.getFases()).stream()
                .map(ProgresoLogisticaService::validarFase)
                .toList();
        boolean completado = Boolean.TRUE.equals(request.getCompletado());
        UsuarioAuditoriaDTO actor = obtenerActor(uid);

        int actualizados = 0;
        List<String> omitidos = new ArrayList<>();
        for (String uuid : uuids) {
            EtiquetaQrDetalleDTO ficha = etiquetaQrService.obtenerPorUuid(uuid);
            if (ficha == null) {
                omitidos.add(uuid);
                continue;
            }
            List<String> todosLosIds = idsDeFicha(ficha);
            for (String fase : fases) {
                aplicarCambio(uuid, ficha, fase, todosLosIds, completado, actor);
            }
            actualizados++;
        }
        return new ResultadoProgresoLogisticaMasivoDTO(actualizados, omitidos);
    }

    private void aplicarCambio(
            String uuid,
            EtiquetaQrDetalleDTO ficha,
            String fase,
            List<String> idsAfectados,
            boolean completado,
            UsuarioAuditoriaDTO actor)
            throws ExecutionException, InterruptedException {
        List<String> todosLosIds = idsDeFicha(ficha);
        if (todosLosIds.size() > MAX_ITEMS_POR_PUESTO) {
            throw new IllegalArgumentException(
                    "El puesto supera el máximo de " + MAX_ITEMS_POR_PUESTO + " elementos.");
        }
        if (!new LinkedHashSet<>(todosLosIds).containsAll(idsAfectados)) {
            throw new IllegalArgumentException(
                    "Los elementos afectados deben pertenecer a la ficha del puesto.");
        }
        progresoRepository.actualizar(
                uuid,
                fase,
                idsAfectados,
                completado,
                todosLosIds,
                actor);
    }

    private static String validarFase(String faseRaw) {
        String fase = faseRaw == null ? "" : faseRaw.trim().toLowerCase();
        if (!FASES_VALIDAS.contains(fase)) {
            throw new IllegalArgumentException("Fase logística inválida: " + faseRaw);
        }
        return fase;
    }

    private UsuarioAuditoriaDTO obtenerActor(String uid)
            throws ExecutionException, InterruptedException {
        Usuario usuario = usuarioRepository.findById(uid).orElse(null);
        if (usuario == null) {
            return new UsuarioAuditoriaDTO(uid, null, null);
        }
        return new UsuarioAuditoriaDTO(usuario.getId(), usuario.getNombre(), usuario.getEmail());
    }

    private static List<String> limpiarIds(List<String> ids) {
        return ids.stream()
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .distinct()
                .toList();
    }

    private static List<String> idsDeFicha(EtiquetaQrDetalleDTO ficha) {
        LinkedHashSet<String> ids = new LinkedHashSet<>();
        ids.add("pc-" + ficha.getUuid());
        List<EtiquetaQrItemDTO> monitores = ficha.getMonitores() == null
                ? List.of()
                : ficha.getMonitores();
        List<EtiquetaQrItemDTO> perifericos = ficha.getPerifericos() == null
                ? List.of()
                : ficha.getPerifericos();
        for (int i = 0; i < monitores.size(); i++) {
            ids.add("mon-" + i + "-" + monitores.get(i).getNombre());
        }
        for (int i = 0; i < perifericos.size(); i++) {
            ids.add("perif-" + i + "-" + perifericos.get(i).getNombre());
        }
        return List.copyOf(ids);
    }
}
