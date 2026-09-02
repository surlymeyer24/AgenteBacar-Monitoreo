package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.mapper.RouterMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.RouterRepository;

@Service
public class RouterService {

    private final RouterRepository routerRepository;

    public RouterService(RouterRepository routerRepository) {
        this.routerRepository = routerRepository;
    }

    public List<RouterDTO> listarTodos() throws ExecutionException, InterruptedException {
        return routerRepository.findAll().stream()
                .map(RouterMapper::toDTO)
                .collect(Collectors.toList());
    }

    public RouterDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return RouterMapper.toDTO(routerRepository.findById(id));
    }

    public RouterDTO crear(RouterCreateDTO dto) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        UbicacionRed ubicacion;
        try {
            ubicacion = UbicacionRed.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + dto.getUbicacion(), ex);
        }

        Router router = new Router();
        router.setNombre(dto.getNombre().trim());
        router.setMarca(blankToNull(dto.getMarca()));
        router.setModelo(blankToNull(dto.getModelo()));
        router.setIp(blankToNull(dto.getIp()));
        router.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
        router.setFirmware(blankToNull(dto.getFirmware()));
        router.setCantidadPuertosWan(dto.getCantidadPuertosWan());
        router.setCantidadPuertosLan(dto.getCantidadPuertosLan());
        router.setGateway(blankToNull(dto.getGateway()));
        router.setUbicacion(ubicacion);
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        router.setFechaAlta(fa.toString());

        String id = routerRepository.create(router);
        return RouterMapper.toDTO(routerRepository.findById(id));
    }

    public RouterDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        Router router = routerRepository.findById(id);
        if (router == null) {
            return null;
        }
        String trimmed = estadoRaw == null ? "" : estadoRaw.trim();
        EstadoOperativo estadoOperativo;
        try {
            estadoOperativo = EstadoOperativo.valueOf(trimmed);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
        }
        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        routerRepository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static void validarCrear(RouterCreateDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    /** Firestore {@code update} no acepta null; los campos editables del form van como string (vacío si se limpia). */
    private static String blankToEmpty(String s) {
        if (s == null || s.isBlank()) {
            return "";
        }
        return s.trim();
    }

    /** Solo incluye el campo si el cliente lo envió (evita pisar datos Omada no editados en el modal). */
    private static void putSiPresente(Map<String, Object> campos, String key, String value) {
        if (value != null && !value.isBlank()) {
            campos.put(key, value.trim());
        }
    }

    public RouterDTO update(String id, RouterCreateDTO dto) throws ExecutionException, InterruptedException {
        Router routerExistente = routerRepository.findById(id);
        if (routerExistente == null) {
            throw new IllegalArgumentException("Router no encontrado: " + id);
        }

        validarCrear(dto);

        UbicacionRed ubicacion;
        try {
            ubicacion = UbicacionRed.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + dto.getUbicacion(), ex);
        }

        Map<String, Object> campos = new HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToEmpty(dto.getMarca()));
        campos.put("modelo", blankToEmpty(dto.getModelo()));
        campos.put("ip", blankToEmpty(dto.getIp()));
        campos.put("numero_serie", blankToEmpty(dto.getNumeroSerie()));
        campos.put("firmware", blankToEmpty(dto.getFirmware()));
        campos.put("cantidad_puertos_wan", dto.getCantidadPuertosWan());
        campos.put("cantidad_puertos_lan", dto.getCantidadPuertosLan());
        campos.put("gateway", blankToEmpty(dto.getGateway()));
        campos.put("ubicacion", ubicacion.name());

        if (dto.getFechaAlta() != null) {
            campos.put("fecha_alta", dto.getFechaAlta().toString());
        }

        // Campos Omada: conservar si el front no los manda
        putSiPresente(campos, "sitio", dto.getSitio());
        putSiPresente(campos, "ip_publica", dto.getIpPublica());
        putSiPresente(campos, "estado", dto.getEstadoOmada());
        putSiPresente(campos, "version", dto.getVersion());
        putSiPresente(campos, "mac_uplink", dto.getMacUplink());
        putSiPresente(campos, "grupo_wlan", dto.getGrupoWlan());
        if (dto.getSalto() != null) {
            campos.put("salto", dto.getSalto());
        }

        routerRepository.update(id, campos);

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (routerRepository.findById(id) == null) {
            return false;
        }
        routerRepository.deleteById(id);
        return true;
    }
}
