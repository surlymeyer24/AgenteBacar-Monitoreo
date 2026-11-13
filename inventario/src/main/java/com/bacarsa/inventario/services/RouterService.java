package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.RouterHistorialReglas;
import com.bacarsa.inventario.mapper.RouterMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class RouterService {

    private final RouterRepository routerRepository;
    private final UsuarioRepository usuarioRepository;

    public RouterService(RouterRepository routerRepository, UsuarioRepository usuarioRepository) {
        this.routerRepository = routerRepository;
        this.usuarioRepository = usuarioRepository;
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
        return crear(dto, null);
    }

    public RouterDTO crear(RouterCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        UbicacionRed ubicacion;
        try {
            ubicacion = UbicacionRed.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + dto.getUbicacion(), ex);
        }

        String id = UUID.randomUUID().toString();
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();

        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nombre", dto.getNombre().trim());
        if (blankToNull(dto.getMarca()) != null) cuerpo.put("marca", dto.getMarca().trim());
        if (blankToNull(dto.getModelo()) != null) cuerpo.put("modelo", dto.getModelo().trim());
        if (blankToNull(dto.getIp()) != null) cuerpo.put("ip", dto.getIp().trim());
        if (blankToNull(dto.getNumeroSerie()) != null) cuerpo.put("numero_serie", dto.getNumeroSerie().trim());
        if (blankToNull(dto.getFirmware()) != null) cuerpo.put("firmware", dto.getFirmware().trim());
        cuerpo.put("cantidad_puertos_wan", dto.getCantidadPuertosWan());
        cuerpo.put("cantidad_puertos_lan", dto.getCantidadPuertosLan());
        if (blankToNull(dto.getGateway()) != null) cuerpo.put("gateway", dto.getGateway().trim());
        cuerpo.put("ubicacion", ubicacion.name());
        cuerpo.put("fecha_alta", fa.toString());

        ActorHistorial actor = resolverActor(actorUid);

        routerRepository.aplicarHistorial(id, (doc, ahora) ->
                RouterHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public RouterDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estadoRaw, motivo, null);
    }

    public RouterDTO cambiarEstado(String id, String estadoRaw, String motivo, String actorUid)
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

        ActorHistorial actor = resolverActor(actorUid);

        routerRepository.aplicarHistorial(id, (doc, ahora) ->
                RouterHistorialReglas.cambioEstado(doc, estado, motivo, actor, ahora));

        return obtenerPorId(id);
    }

    public RouterDTO update(String id, RouterCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public RouterDTO update(String id, RouterCreateDTO dto, String actorUid)
            throws ExecutionException, InterruptedException {
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

        ActorHistorial actor = resolverActor(actorUid);

        routerRepository.aplicarHistorial(id, (doc, ahora) ->
                RouterHistorialReglas.edicionFicha(doc, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (routerRepository.findById(id) == null) {
            return false;
        }
        cambiarEstado(id, "BAJA", "Baja de equipo solicitada por usuario", actorUid);
        return true;
    }

    private ActorHistorial resolverActor(String uid) {
        if (uid == null || uid.isBlank()) {
            return ActorHistorial.SISTEMA;
        }
        try {
            return usuarioRepository.findById(uid)
                    .map(u -> new ActorHistorial(u.getId(), u.getNombre() != null ? u.getNombre() : u.getEmail()))
                    .orElseGet(() -> new ActorHistorial(uid, ""));
        } catch (Exception ex) {
            return new ActorHistorial(uid, "");
        }
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

    private static String blankToEmpty(String s) {
        if (s == null || s.isBlank()) {
            return "";
        }
        return s.trim();
    }

    private static void putSiPresente(Map<String, Object> campos, String key, String value) {
        if (value != null && !value.isBlank()) {
            campos.put(key, value.trim());
        }
    }
}
