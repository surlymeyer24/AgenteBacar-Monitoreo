package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AccessPointCreateDTO;
import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.historial.AccessPointHistorialReglas;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.mapper.AccessPointMapper;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class AccessPointService {

    private final AccessPointRepository accessPointRepository;
    private final UsuarioRepository usuarioRepository;

    public AccessPointService(AccessPointRepository accessPointRepository, UsuarioRepository usuarioRepository) {
        this.accessPointRepository = accessPointRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<AccessPointDTO> listarTodos() throws ExecutionException, InterruptedException {
        return accessPointRepository.findAll().stream()
                .map(AccessPointMapper::toDTO)
                .collect(Collectors.toList());
    }

    public AccessPointDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return AccessPointMapper.toDTO(accessPointRepository.findById(id));
    }

    public AccessPointDTO crear(AccessPointCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public AccessPointDTO crear(AccessPointCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
        validar(dto);
        UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());

        String id = UUID.randomUUID().toString();
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nombre", dto.getNombre().trim());
        if (blankToNull(dto.getMarca()) != null) cuerpo.put("marca", dto.getMarca().trim());
        if (blankToNull(dto.getModelo()) != null) cuerpo.put("modelo", dto.getModelo().trim());
        if (blankToNull(dto.getIp()) != null) cuerpo.put("ip", dto.getIp().trim());
        if (blankToNull(dto.getMac()) != null) cuerpo.put("mac", dto.getMac().trim());
        if (blankToNull(dto.getSwitchUplink()) != null) cuerpo.put("switch_uplink", dto.getSwitchUplink().trim());
        cuerpo.put("ubicacion", ubicacion.name());
        cuerpo.put("estado", blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "OPERATIVO");

        ActorHistorial actor = resolverActor(actorUid);

        accessPointRepository.aplicarHistorial(id, (doc, ahora) ->
                AccessPointHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public AccessPointDTO update(String id, AccessPointCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public AccessPointDTO update(String id, AccessPointCreateDTO dto, String actorUid)
            throws ExecutionException, InterruptedException {
        if (accessPointRepository.findById(id) == null) {
            throw new IllegalArgumentException("Access Point no encontrado: " + id);
        }
        validar(dto);
        UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());

        Map<String, Object> campos = new HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToEmpty(dto.getMarca()));
        campos.put("modelo", blankToEmpty(dto.getModelo()));
        campos.put("ip", blankToEmpty(dto.getIp()));
        campos.put("mac", blankToEmpty(dto.getMac()));
        campos.put("switch_uplink", blankToEmpty(dto.getSwitchUplink()));
        campos.put("ubicacion", ubicacion.name());
        campos.put("estado", blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "OPERATIVO");

        ActorHistorial actor = resolverActor(actorUid);

        accessPointRepository.aplicarHistorial(id, (doc, ahora) ->
                AccessPointHistorialReglas.edicionFicha(doc, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public AccessPointDTO cambiarEstado(String id, String estado, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estado, motivo, null);
    }

    public AccessPointDTO cambiarEstado(String id, String estado, String motivo, String actorUid)
            throws ExecutionException, InterruptedException {
        if (accessPointRepository.findById(id) == null) {
            return null;
        }
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }

        ActorHistorial actor = resolverActor(actorUid);

        accessPointRepository.aplicarHistorial(id, (doc, ahora) ->
                AccessPointHistorialReglas.cambioEstado(doc, estado, motivo, actor, ahora));

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (accessPointRepository.findById(id) == null) {
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

    private static void validar(AccessPointCreateDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
    }

    private static UbicacionRed parseUbicacion(String raw) {
        try {
            return UbicacionRed.valueOf(raw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + raw, ex);
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
}
