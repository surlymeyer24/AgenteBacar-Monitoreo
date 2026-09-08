package com.bacarsa.inventario.services;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.EventoHardwareDTO;
import com.bacarsa.inventario.dto.EventoHardwareUpdateDTO;
import com.bacarsa.inventario.mapper.EventoHardwareMapper;
import com.bacarsa.inventario.models.EventoHardware;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.EventoHardwareRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@Service
public class EventoHardwareService {

    private static final long DEDUP_WINDOW_MILLIS = 10 * 60 * 1000L;

    private final EventoHardwareRepository repository;
    private final UsuarioRepository usuarioRepository;

    public EventoHardwareService(EventoHardwareRepository repository,
            UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<EventoHardwareDTO> listar(String estado, String uuid, Boolean leido)
            throws ExecutionException, InterruptedException {
        boolean sinFiltros = (estado == null || estado.isBlank())
                && (uuid == null || uuid.isBlank())
                && leido == null;
        List<EventoHardware> eventos = sinFiltros
                ? repository.findAll()
                : repository.findFiltered(estado, uuid, leido);
        List<EventoHardware> deduplicados = deduplicar(eventos);
        return deduplicados.stream()
                .map(EventoHardwareMapper::toDTO)
                .collect(Collectors.toList());
    }

    public EventoHardwareDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return EventoHardwareMapper.toDTO(repository.findById(id));
    }

    public long contarPendientesNoLeidos() throws ExecutionException, InterruptedException {
        return repository.countPendientesNoLeidos();
    }

    public EventoHardwareDTO actualizar(String id, EventoHardwareUpdateDTO dto, String uidRevisor)
            throws ExecutionException, InterruptedException {
        EventoHardware existente = repository.findById(id);
        if (existente == null) return null;

        Map<String, Object> fields = new HashMap<>();

        if (dto.getEstadoSeguimiento() != null && !dto.getEstadoSeguimiento().isBlank()) {
            fields.put("estado_seguimiento", dto.getEstadoSeguimiento().trim());
        }
        if (dto.getNotasIt() != null) {
            fields.put("notas_it", dto.getNotasIt().trim().isEmpty() ? null : dto.getNotasIt().trim());
        }
        if (dto.getLeido() != null) {
            fields.put("leido", dto.getLeido());
        }

        String nuevoEstado = dto.getEstadoSeguimiento();
        if (nuevoEstado != null && !nuevoEstado.isBlank() && !"pendiente".equals(nuevoEstado.trim())) {
            fields.put("revisado_en", Timestamp.now());
            String revisadoPor = resolveRevisadoPor(uidRevisor);
            if (revisadoPor != null) {
                fields.put("revisado_por", revisadoPor);
            }
        }

        if (!fields.isEmpty()) {
            repository.update(id, fields);
        }
        return obtenerPorId(id);
    }

    private String resolveRevisadoPor(String uid) throws ExecutionException, InterruptedException {
        if (uid == null || uid.isBlank()) {
            return null;
        }
        return usuarioRepository.findById(uid)
                .map(Usuario::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .orElse(null);
    }

    /**
     * Deduplicación: mismo uuid + fingerprint + tipo_evento + tipo_componente
     * en ventana de ~10 minutos → conservar solo el más reciente.
     * La lista ya viene ordenada por timestamp DESC.
     */
    private List<EventoHardware> deduplicar(List<EventoHardware> eventos) {
        Map<String, EventoHardware> vistos = new LinkedHashMap<>();
        Map<String, Long> timestampVistos = new HashMap<>();

        for (EventoHardware ev : eventos) {
            String clave = dedupKey(ev);
            long tsMs = ev.getTimestamp() != null
                    ? ev.getTimestamp().toDate().getTime()
                    : 0L;

            if (vistos.containsKey(clave)) {
                long tsExistente = timestampVistos.get(clave);
                if (Math.abs(tsMs - tsExistente) <= DEDUP_WINDOW_MILLIS) {
                    continue;
                }
            }
            vistos.put(clave + "|" + tsMs, ev);
            timestampVistos.put(clave, tsMs);
        }
        return new ArrayList<>(vistos.values());
    }

    private static String dedupKey(EventoHardware ev) {
        return String.join("|",
                ev.getUuid() != null ? ev.getUuid() : "",
                ev.getFingerprint() != null ? ev.getFingerprint() : "",
                ev.getTipoEvento() != null ? ev.getTipoEvento() : "",
                ev.getTipoComponente() != null ? ev.getTipoComponente() : "");
    }
}
