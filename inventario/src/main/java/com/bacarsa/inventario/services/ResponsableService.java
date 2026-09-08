package com.bacarsa.inventario.services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AsignacionResponsableDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.dto.ResponsableDetalleDTO;
import com.bacarsa.inventario.dto.ResponsableListadoDTO;
import com.bacarsa.inventario.models.AsignacionResponsable;
import com.bacarsa.inventario.models.Responsable;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.ResponsableRepository;
import com.bacarsa.inventario.util.ResponsableSlugHelper;
import com.google.cloud.Timestamp;

@Service
public class ResponsableService {

    private final ResponsableRepository responsableRepository;
    private final ComputadoraRepository computadoraRepository;

    public ResponsableService(ResponsableRepository responsableRepository,
            ComputadoraRepository computadoraRepository) {
        this.responsableRepository = responsableRepository;
        this.computadoraRepository = computadoraRepository;
    }

    public List<ResponsableListadoDTO> listar() throws ExecutionException, InterruptedException {
        asegurarIndiceInicial();
        List<Responsable> rows = responsableRepository.findAll();
        rows.sort(Comparator.comparing(r -> r.getNombre() == null ? "" : r.getNombre(), String.CASE_INSENSITIVE_ORDER));
        List<ResponsableListadoDTO> out = new ArrayList<>();
        for (Responsable r : rows) {
            if (r.getCantidadEquipos() <= 0) {
                continue;
            }
            out.add(new ResponsableListadoDTO(
                    r.getId(),
                    r.getNombre(),
                    r.getCantidadEquipos(),
                    iso(r.getActualizadoAt())));
        }
        return out;
    }

    public ResponsableDetalleDTO obtenerDetalle(String id) throws ExecutionException, InterruptedException {
        if (id == null || id.isBlank()) {
            return null;
        }
        Responsable r = responsableRepository.findById(id);
        if (r == null) {
            return null;
        }
        List<AsignacionResponsable> asignaciones = responsableRepository.findAsignaciones(id);
        Map<String, ComputadoraListadoDTO> pcsPorUuid = indexListado(computadoraRepository.findAllListado());

        List<AsignacionResponsableDTO> equipos = new ArrayList<>();
        for (AsignacionResponsable a : asignaciones) {
            ComputadoraListadoDTO pc = pcsPorUuid.get(a.getComputadoraUuid());
            equipos.add(new AsignacionResponsableDTO(
                    a.getComputadoraUuid(),
                    firstNonBlank(a.getHostname(), pc != null ? pc.getHostname() : null),
                    firstNonBlank(a.getUbicacion(), pc != null ? pc.getUbicacion() : null),
                    pc != null ? pc.getEstadoActual() : null,
                    iso(a.getAsignadoAt())));
        }
        equipos.sort(Comparator.comparing(
                a -> a.getHostname() == null ? "" : a.getHostname(),
                String.CASE_INSENSITIVE_ORDER));

        return new ResponsableDetalleDTO(
                r.getId(),
                r.getNombre(),
                r.getCantidadEquipos(),
                equipos);
    }

    public void sincronizarAsignacionPc(String computadoraUuid, String responsableAnterior, String responsableNuevo,
            String hostname, String ubicacion) throws ExecutionException, InterruptedException {
        if (computadoraUuid == null || computadoraUuid.isBlank()) {
            return;
        }
        if (ResponsableSlugHelper.mismoResponsable(responsableAnterior, responsableNuevo)) {
            return;
        }
        quitarDeResponsable(responsableAnterior, computadoraUuid);
        agregarAResponsable(responsableNuevo, computadoraUuid, hostname, ubicacion);
    }

    public void quitarPcDeIndice(String computadoraUuid, String responsableActual)
            throws ExecutionException, InterruptedException {
        quitarDeResponsable(responsableActual, computadoraUuid);
    }

    public void reconstruirIndice() throws ExecutionException, InterruptedException {
        responsableRepository.limpiarColeccion();
        for (ComputadoraListadoDTO pc : computadoraRepository.findAllListado()) {
            String ri = blankToNull(pc.getResponsableInventario());
            if (ri == null || pc.getUuid() == null) {
                continue;
            }
            agregarAResponsable(ri, pc.getUuid(), pc.getHostname(), pc.getUbicacion());
        }
    }

    private void asegurarIndiceInicial() throws ExecutionException, InterruptedException {
        List<Responsable> actuales = responsableRepository.findAll();
        if (!actuales.isEmpty()) {
            return;
        }
        boolean hayAsignaciones = computadoraRepository.findAllListado().stream()
                .anyMatch(pc -> blankToNull(pc.getResponsableInventario()) != null);
        if (hayAsignaciones) {
            reconstruirIndice();
        }
    }

    private void agregarAResponsable(String nombre, String computadoraUuid, String hostname, String ubicacion)
            throws ExecutionException, InterruptedException {
        String slug = ResponsableSlugHelper.slugDeNombre(nombre);
        if (slug == null) {
            return;
        }
        responsableRepository.registrarAsignacion(slug, nombre.trim(), computadoraUuid, hostname, ubicacion);
    }

    private void quitarDeResponsable(String nombre, String computadoraUuid)
            throws ExecutionException, InterruptedException {
        String slug = ResponsableSlugHelper.slugDeNombre(nombre);
        if (slug == null) {
            return;
        }
        responsableRepository.quitarAsignacion(slug, computadoraUuid);
    }

    private static Map<String, ComputadoraListadoDTO> indexListado(List<ComputadoraListadoDTO> listado) {
        Map<String, ComputadoraListadoDTO> map = new HashMap<>();
        if (listado == null) {
            return map;
        }
        for (ComputadoraListadoDTO pc : listado) {
            if (pc != null && pc.getUuid() != null) {
                map.put(pc.getUuid(), pc);
            }
        }
        return map;
    }

    private static String iso(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return Instant.ofEpochMilli(ts.toDate().getTime()).toString();
    }

    private static String blankToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        if (b != null && !b.isBlank()) {
            return b;
        }
        return null;
    }
}
