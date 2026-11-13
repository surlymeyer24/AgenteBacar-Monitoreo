package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ServidorDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.ServidorHistorialReglas;
import com.bacarsa.inventario.mapper.ServidorMapper;
import com.bacarsa.inventario.models.Servidor;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.ServidorRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class ServidorService {

    private final ServidorRepository servidorRepository;
    private final UsuarioRepository usuarioRepository;

    public ServidorService(ServidorRepository servidorRepository, UsuarioRepository usuarioRepository) {
        this.servidorRepository = servidorRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<ServidorDTO> listarTodos() throws ExecutionException, InterruptedException {
        return servidorRepository.findAll().stream()
                .map(ServidorMapper::toDTO)
                .collect(Collectors.toList());
    }

    public ServidorDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return ServidorMapper.toDTO(servidorRepository.findById(id));
    }

    public ServidorDTO crear(ServidorDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public ServidorDTO crear(ServidorDTO dto, String actorUid) throws ExecutionException, InterruptedException {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        String id = UUID.randomUUID().toString();
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nombre", dto.getNombre().trim());
        if (blankToNull(dto.getHostname()) != null) cuerpo.put("hostname", dto.getHostname().trim());
        if (blankToNull(dto.getIp()) != null) cuerpo.put("ip", dto.getIp().trim());
        if (blankToNull(dto.getSistemaOperativo()) != null) cuerpo.put("sistemaOperativo", dto.getSistemaOperativo().trim());
        if (blankToNull(dto.getUbicacion()) != null) cuerpo.put("ubicacion", dto.getUbicacion().trim());
        if (blankToNull(dto.getDescripcion()) != null) cuerpo.put("descripcion", dto.getDescripcion().trim());
        cuerpo.put("estado", blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "activo");

        ActorHistorial actor = resolverActor(actorUid);

        servidorRepository.aplicarHistorial(id, (doc, ahora) ->
                ServidorHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public ServidorDTO actualizar(String id, ServidorDTO dto) throws ExecutionException, InterruptedException {
        return actualizar(id, dto, null);
    }

    public ServidorDTO actualizar(String id, ServidorDTO dto, String actorUid)
            throws ExecutionException, InterruptedException {
        if (servidorRepository.findById(id) == null) return null;

        Map<String, Object> fields = new HashMap<>();
        if (dto.getNombre() != null) fields.put("nombre", dto.getNombre().trim());
        if (dto.getHostname() != null) fields.put("hostname", blankToNull(dto.getHostname()));
        if (dto.getIp() != null) fields.put("ip", blankToNull(dto.getIp()));
        if (dto.getSistemaOperativo() != null) fields.put("sistemaOperativo", blankToNull(dto.getSistemaOperativo()));
        if (dto.getUbicacion() != null) fields.put("ubicacion", blankToNull(dto.getUbicacion()));
        if (dto.getDescripcion() != null) fields.put("descripcion", blankToNull(dto.getDescripcion()));
        if (dto.getEstado() != null) fields.put("estado", blankToNull(dto.getEstado()));

        ActorHistorial actor = resolverActor(actorUid);

        servidorRepository.aplicarHistorial(id, (doc, ahora) ->
                ServidorHistorialReglas.edicionFicha(doc, fields, actor, ahora));

        return obtenerPorId(id);
    }

    public ServidorDTO cambiarEstado(String id, String estado, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estado, motivo, null);
    }

    public ServidorDTO cambiarEstado(String id, String estado, String motivo, String actorUid)
            throws ExecutionException, InterruptedException {
        if (servidorRepository.findById(id) == null) {
            return null;
        }
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }

        ActorHistorial actor = resolverActor(actorUid);

        servidorRepository.aplicarHistorial(id, (doc, ahora) ->
                ServidorHistorialReglas.cambioEstado(doc, estado.trim(), motivo, actor, ahora));

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (servidorRepository.findById(id) == null) return false;
        cambiarEstado(id, "inactivo", "Baja de equipo solicitada por usuario", actorUid);
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

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim();
    }
}
