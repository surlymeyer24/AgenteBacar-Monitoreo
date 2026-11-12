package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.SwitchRedCreateDTO;
import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.SwitchRedHistorialReglas;
import com.bacarsa.inventario.mapper.SwitchRedMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class SwitchRedService {

    private final SwitchRedRepository switchRedRepository;
    private final UsuarioRepository usuarioRepository;

    public SwitchRedService(SwitchRedRepository switchRedRepository, UsuarioRepository usuarioRepository) {
        this.switchRedRepository = switchRedRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<SwitchRedDTO> listarTodos() throws ExecutionException, InterruptedException {
        return switchRedRepository.findAll().stream()
                .map(SwitchRedMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SwitchRedDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return SwitchRedMapper.toDTO(switchRedRepository.findById(id));
    }

    public SwitchRedDTO crear(SwitchRedCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public SwitchRedDTO crear(SwitchRedCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
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
        cuerpo.put("cantidad_puertos", dto.getCantidadPuertos());
        if (blankToNull(dto.getTipo()) != null) cuerpo.put("tipo", dto.getTipo().trim());
        cuerpo.put("vlans", dto.getVlans() != null ? dto.getVlans() : List.of());
        cuerpo.put("ubicacion", ubicacion.name());
        cuerpo.put("fecha_alta", fa.toString());

        ActorHistorial actor = resolverActor(actorUid);

        switchRedRepository.aplicarHistorial(id, (doc, ahora) ->
                SwitchRedHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public SwitchRedDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estadoRaw, motivo, null);
    }

    public SwitchRedDTO cambiarEstado(String id, String estadoRaw, String motivo, String actorUid)
            throws ExecutionException, InterruptedException {
        SwitchRed sw = switchRedRepository.findById(id);
        if (sw == null) {
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

        switchRedRepository.aplicarHistorial(id, (doc, ahora) ->
                SwitchRedHistorialReglas.cambioEstado(doc, estado, motivo, actor, ahora));

        return obtenerPorId(id);
    }

    public SwitchRedDTO update(String id, SwitchRedCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public SwitchRedDTO update(String id, SwitchRedCreateDTO dto, String actorUid)
            throws ExecutionException, InterruptedException {
        SwitchRed swExistente = switchRedRepository.findById(id);
        if (swExistente == null) {
            throw new IllegalArgumentException("Switch no encontrado: " + id);
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
        campos.put("cantidad_puertos", dto.getCantidadPuertos());
        campos.put("tipo", blankToEmpty(dto.getTipo()));
        campos.put("vlans", dto.getVlans() != null ? dto.getVlans() : List.of());
        campos.put("ubicacion", ubicacion.name());

        if (dto.getFechaAlta() != null) {
            campos.put("fecha_alta", dto.getFechaAlta().toString());
        }

        putSiPresente(campos, "sitio", dto.getSitio());
        putSiPresente(campos, "ip_publica", dto.getIpPublica());
        putSiPresente(campos, "estado", dto.getEstadoOmada());
        putSiPresente(campos, "version", dto.getVersion());
        putSiPresente(campos, "mac_uplink", dto.getMacUplink());
        if (dto.getSalto() != null) {
            campos.put("salto", dto.getSalto());
        }

        ActorHistorial actor = resolverActor(actorUid);

        switchRedRepository.aplicarHistorial(id, (doc, ahora) ->
                SwitchRedHistorialReglas.edicionFicha(doc, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (switchRedRepository.findById(id) == null) {
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

    private static void validarCrear(SwitchRedCreateDTO dto) {
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
