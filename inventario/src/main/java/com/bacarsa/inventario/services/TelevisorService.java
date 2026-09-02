package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.TelevisorCreateDTO;
import com.bacarsa.inventario.dto.TelevisorDTO;
import com.bacarsa.inventario.mapper.TelevisorMapper;
import com.bacarsa.inventario.models.EstadoTelevisor;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.repository.TelevisorRepository;

@Service
public class TelevisorService {

    private final TelevisorRepository televisorRepository;

    public TelevisorService(TelevisorRepository televisorRepository) {
        this.televisorRepository = televisorRepository;
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
        validar(dto);
        Televisor tv = fromDto(dto);
        String id = televisorRepository.create(tv);
        return obtenerPorId(id);
    }

    public TelevisorDTO update(String id, TelevisorCreateDTO dto)
            throws ExecutionException, InterruptedException {
        if (televisorRepository.findById(id) == null) {
            throw new IllegalArgumentException("Televisor no encontrado: " + id);
        }
        validar(dto);
        televisorRepository.update(id, toUpdateMap(dto));
        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (televisorRepository.findById(id) == null) {
            return false;
        }
        televisorRepository.deleteById(id);
        return true;
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

    private static Televisor fromDto(TelevisorCreateDTO dto) {
        Televisor tv = new Televisor();
        tv.setMarca(dto.getMarca().trim());
        tv.setModelo(blankToNull(dto.getModelo()));
        tv.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
        tv.setArea(dto.getArea().trim());
        tv.setDireccionIp(blankToNull(dto.getDireccionIp()));
        tv.setEstado(parseEstado(dto.getEstado()).name());
        return tv;
    }

    private static Map<String, Object> toUpdateMap(TelevisorCreateDTO dto) {
        Map<String, Object> campos = new HashMap<>();
        campos.put("marca", dto.getMarca().trim());
        campos.put("modelo", blankToNull(dto.getModelo()));
        campos.put("numero_serie", blankToNull(dto.getNumeroSerie()));
        campos.put("area", dto.getArea().trim());
        campos.put("direccion_ip", blankToNull(dto.getDireccionIp()));
        campos.put("estado", parseEstado(dto.getEstado()).name());
        return campos;
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
}
