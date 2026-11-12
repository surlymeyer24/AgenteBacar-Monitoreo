package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.TelevisorCreateDTO;
import com.bacarsa.inventario.dto.TelevisorDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.TelevisorHistorialReglas;
import com.bacarsa.inventario.mapper.TelevisorMapper;
import com.bacarsa.inventario.models.EstadoTelevisor;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.TelevisorRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@Service
public class TelevisorService {

    private final TelevisorRepository televisorRepository;
    private final UsuarioRepository usuarioRepository;

    public TelevisorService(TelevisorRepository televisorRepository, UsuarioRepository usuarioRepository) {
        this.televisorRepository = televisorRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<TelevisorDTO> listarTodos() throws ExecutionException, InterruptedException {
        return televisorRepository.findAll().stream()
                .map(TelevisorMapper::toDTO)
                .collect(Collectors.toList());
    }

    public TelevisorDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return TelevisorMapper.toDTO(televisorRepository.findById(id));
    }

    public TelevisorDTO crear(TelevisorCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public TelevisorDTO crear(TelevisorCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
        validar(dto);
        String estado = parseEstado(dto.getEstado()).name();

        String id = UUID.randomUUID().toString();
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("marca", dto.getMarca().trim());
        if (blankToNull(dto.getModelo()) != null) cuerpo.put("modelo", dto.getModelo().trim());
        if (blankToNull(dto.getNumeroSerie()) != null) cuerpo.put("numero_serie", dto.getNumeroSerie().trim());
        cuerpo.put("area", dto.getArea().trim());
        if (blankToNull(dto.getDireccionIp()) != null) cuerpo.put("direccion_ip", dto.getDireccionIp().trim());
        cuerpo.put("estado", estado);

        ActorHistorial actor = resolverActor(actorUid);

        televisorRepository.aplicarHistorial(id, (doc, ahora) ->
                TelevisorHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public TelevisorDTO update(String id, TelevisorCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public TelevisorDTO update(String id, TelevisorCreateDTO dto, String actorUid)
            throws ExecutionException, InterruptedException {
        if (televisorRepository.findById(id) == null) {
            throw new IllegalArgumentException("Televisor no encontrado: " + id);
        }
        validar(dto);
        String estado = parseEstado(dto.getEstado()).name();

        Map<String, Object> campos = new HashMap<>();
        campos.put("marca", dto.getMarca().trim());
        campos.put("modelo", blankToEmpty(dto.getModelo()));
        campos.put("numero_serie", blankToEmpty(dto.getNumeroSerie()));
        campos.put("area", dto.getArea().trim());
        campos.put("direccion_ip", blankToEmpty(dto.getDireccionIp()));
        campos.put("estado", estado);

        ActorHistorial actor = resolverActor(actorUid);

        televisorRepository.aplicarHistorial(id, (doc, ahora) ->
                TelevisorHistorialReglas.edicionFicha(doc, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public TelevisorDTO cambiarEstado(String id, String estado, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estado, motivo, null);
    }

    public TelevisorDTO cambiarEstado(String id, String estado, String motivo, String actorUid)
            throws ExecutionException, InterruptedException {
        if (televisorRepository.findById(id) == null) {
            return null;
        }
        String estadoNormalizado = parseEstado(estado).name();

        ActorHistorial actor = resolverActor(actorUid);

        televisorRepository.aplicarHistorial(id, (doc, ahora) ->
                TelevisorHistorialReglas.cambioEstado(doc, estadoNormalizado, motivo, actor, ahora));

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (televisorRepository.findById(id) == null) {
            return false;
        }
        cambiarEstado(id, "baja", "Baja de equipo solicitada por usuario", actorUid);
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

    private static void validar(TelevisorCreateDTO dto) {
        if (dto.getMarca() == null || dto.getMarca().isBlank()) {
            throw new IllegalArgumentException("La marca es obligatoria");
        }
        if (dto.getArea() == null || dto.getArea().isBlank()) {
            throw new IllegalArgumentException("El área es obligatoria");
        }
        parseEstado(dto.getEstado());
    }

    private static EstadoTelevisor parseEstado(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }
        String normalized = raw.trim().toLowerCase()
                .replace(' ', '_')
                .replace('-', '_');
        if ("enstock".equals(normalized)) {
            normalized = "en_stock";
        }
        try {
            return EstadoTelevisor.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + raw
                    + " (valores: activo, en_stock, baja)", ex);
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
