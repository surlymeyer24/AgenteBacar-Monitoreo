package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ActualizarPerifericoDTO;
import com.bacarsa.inventario.dto.ComboCreateDTO;
import com.bacarsa.inventario.dto.PerifericoManualCreateDTO;
import com.bacarsa.inventario.dto.PerifericoManualDTO;
import com.bacarsa.inventario.mapper.PerifericoManualMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class PerifericoManualService {

    private final PerifericoManualRepository repository;

    public PerifericoManualService(PerifericoManualRepository repository) {
        this.repository = repository;
    }

    public List<PerifericoManualDTO> listar() throws ExecutionException, InterruptedException {
        return repository.findAll().stream()
                .map(PerifericoManualMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PerifericoManualDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return PerifericoManualMapper.toDTO(repository.findById(id));
    }

    public PerifericoManualDTO crear(PerifericoManualCreateDTO dto)
            throws ExecutionException, InterruptedException {
        if (dto.getTipo() == null || dto.getTipo().isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }

        PerifericoManual p = new PerifericoManual();
        p.setTipo(dto.getTipo().trim());
        p.setCantidad(dto.getCantidad() > 0 ? dto.getCantidad() : 1);
        p.setNombre(blankToNull(dto.getNombre()));
        p.setFabricante(blankToNull(dto.getFabricante()));
        p.setConexion(blankToNull(dto.getConexion()));
        p.setComputadoraHostname(blankToNull(dto.getComputadoraHostname()));
        p.setUbicacion(blankToNull(dto.getUbicacion()));
        p.setNotas(blankToNull(dto.getNotas()));
        p.setComboId(blankToNull(dto.getComboId()));
        p.setComboNombre(blankToNull(dto.getComboNombre()));
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        p.setFechaAlta(fa.toString());

        String id = repository.create(p);

        String motivoAlta = (dto.getMotivo() != null && !dto.getMotivo().isBlank())
                ? dto.getMotivo().trim()
                : "Alta de periférico";
        cambiarEstado(id, "DERIVAR_ASIGNACION", motivoAlta);

        return obtenerPorId(id);
    }

    public PerifericoManualDTO actualizar(String id, ActualizarPerifericoDTO dto)
            throws ExecutionException, InterruptedException {
        if (repository.findById(id) == null) return null;
        Map<String, Object> campos = new HashMap<>();
        if (dto.getTipo() != null && !dto.getTipo().isBlank())
            campos.put("tipo", dto.getTipo().trim());
        if (dto.getCantidad() != null && dto.getCantidad() > 0)
            campos.put("cantidad", dto.getCantidad());
        campos.put("nombre", dto.getNombre() != null && !dto.getNombre().isBlank() ? dto.getNombre().trim() : null);
        campos.put("fabricante", dto.getFabricante() != null && !dto.getFabricante().isBlank() ? dto.getFabricante().trim() : null);
        campos.put("conexion", dto.getConexion() != null && !dto.getConexion().isBlank() ? dto.getConexion().trim() : null);
        campos.put("computadoraHostname", dto.getComputadoraHostname() != null && !dto.getComputadoraHostname().isBlank() ? dto.getComputadoraHostname().trim() : null);
        campos.put("ubicacion", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : null);
        campos.put("notas", dto.getNotas() != null && !dto.getNotas().isBlank() ? dto.getNotas().trim() : null);
        if (dto.getFechaAlta() != null)
            campos.put("fechaAlta", dto.getFechaAlta().toString());
        if (dto.getComboId() != null)
            campos.put("comboId", dto.getComboId().isBlank() ? null : dto.getComboId().trim());
        if (dto.getComboNombre() != null)
            campos.put("comboNombre", dto.getComboNombre().isBlank() ? null : dto.getComboNombre().trim());
        repository.actualizar(id, campos);
        return obtenerPorId(id);
    }

    public List<PerifericoManualDTO> crearCombo(ComboCreateDTO dto)
            throws ExecutionException, InterruptedException {
        String comboId = UUID.randomUUID().toString();
        String comboNombre = dto.getComboNombre() != null ? dto.getComboNombre().trim() : null;
        List<PerifericoManualDTO> resultado = new ArrayList<>();
        for (PerifericoManualCreateDTO item : dto.getItems()) {
            item.setComboId(comboId);
            item.setComboNombre(comboNombre);
            resultado.add(crear(item));
        }
        return resultado;
    }

    public void eliminar(String id) throws ExecutionException, InterruptedException {
        repository.eliminar(id);
    }

    public PerifericoManualDTO asignar(String id, String computadoraHostname, String motivo)
            throws ExecutionException, InterruptedException {
        PerifericoManual original = repository.findById(id);
        if (original == null) return null;

        String hostname = computadoraHostname.trim();
        String motivoFinal = (motivo != null && !motivo.isBlank()) ? motivo.trim() : "Asignado desde stock";

        if (original.getCantidad() > 1) {
            // Reducir stock original en 1
            repository.decrementarCantidad(id);

            // Crear nuevo registro para la unidad asignada
            PerifericoManual asignado = new PerifericoManual();
            asignado.setTipo(original.getTipo());
            asignado.setCantidad(1);
            asignado.setNombre(original.getNombre());
            asignado.setFabricante(original.getFabricante());
            asignado.setConexion(original.getConexion());
            asignado.setComputadoraHostname(hostname);
            asignado.setNotas(original.getNotas());
            asignado.setFechaAlta(original.getFechaAlta());
            asignado.setComboId(original.getComboId());
            asignado.setComboNombre(original.getComboNombre());

            String nuevoId = repository.create(asignado);
            cambiarEstado(nuevoId, "ASIGNADA", motivoFinal);
            return obtenerPorId(nuevoId);
        } else {
            // Una sola unidad: actualizar el mismo registro
            repository.updateComputadoraHostname(id, hostname);
            return cambiarEstado(id, "ASIGNADA", motivoFinal);
        }
    }

    public PerifericoManualDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        PerifericoManual p = repository.findById(id);
        if (p == null) return null;

        String trimmed = estadoRaw == null ? "" : estadoRaw.trim();
        EstadoOperativo estadoOperativo;
        if ("DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(p.getComputadoraHostname());
        } else {
            try {
                estadoOperativo = EstadoOperativo.valueOf(trimmed);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
            }
        }
        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        repository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
