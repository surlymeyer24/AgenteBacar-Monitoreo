package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CelularCreateDTO;
import com.bacarsa.inventario.dto.CelularDTO;
import com.bacarsa.inventario.mapper.CelularMapper;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.EstadoCelular;
import com.bacarsa.inventario.repository.CelularRepository;

@Service
public class CelularService {

    private final CelularRepository celularRepository;

    public CelularService(CelularRepository celularRepository) {
        this.celularRepository = celularRepository;
    }

    public List<CelularDTO> listarTodos() throws ExecutionException, InterruptedException {
        return celularRepository.findAll().stream()
                .map(CelularMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CelularDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return CelularMapper.toDTO(celularRepository.findById(id));
    }

    public CelularDTO crear(CelularCreateDTO dto) throws ExecutionException, InterruptedException {
        validar(dto);
        Celular celular = fromDto(dto);
        String id = celularRepository.create(celular);
        return obtenerPorId(id);
    }

    public CelularDTO update(String id, CelularCreateDTO dto)
            throws ExecutionException, InterruptedException {
        if (celularRepository.findById(id) == null) {
            throw new IllegalArgumentException("Celular no encontrado: " + id);
        }
        validar(dto);
        celularRepository.update(id, toUpdateMap(dto));
        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (celularRepository.findById(id) == null) {
            return false;
        }
        celularRepository.deleteById(id);
        return true;
    }

    private static void validar(CelularCreateDTO dto) {
        if (dto.getMarca() == null || dto.getMarca().isBlank()) {
            throw new IllegalArgumentException("La marca es obligatoria");
        }
        if (dto.getModelo() == null || dto.getModelo().isBlank()) {
            throw new IllegalArgumentException("El modelo es obligatorio");
        }
        if (dto.getArea() == null || dto.getArea().isBlank()) {
            throw new IllegalArgumentException("El área es obligatoria");
        }
        parseEstado(dto.getEstado());
    }

    private static Celular fromDto(CelularCreateDTO dto) {
        Celular celular = new Celular();
        celular.setMarca(dto.getMarca().trim());
        celular.setModelo(dto.getModelo().trim());
        celular.setImei(blankToNull(dto.getImei()));
        celular.setLineaNumero(blankToNull(dto.getLineaNumero()));
        celular.setResponsable(blankToNull(dto.getResponsable()));
        celular.setArea(dto.getArea().trim());
        celular.setEstado(parseEstado(dto.getEstado()).name());
        return celular;
    }

    private static Map<String, Object> toUpdateMap(CelularCreateDTO dto) {
        Map<String, Object> campos = new HashMap<>();
        campos.put("marca", dto.getMarca().trim());
        campos.put("modelo", dto.getModelo().trim());
        campos.put("imei", blankToNull(dto.getImei()));
        campos.put("linea_numero", blankToNull(dto.getLineaNumero()));
        campos.put("responsable", blankToNull(dto.getResponsable()));
        campos.put("area", dto.getArea().trim());
        campos.put("estado", parseEstado(dto.getEstado()).name());
        return campos;
    }

    private static EstadoCelular parseEstado(String raw) {
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
            return EstadoCelular.valueOf(normalized);
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
