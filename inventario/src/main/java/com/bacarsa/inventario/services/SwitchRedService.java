package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.SwitchRedCreateDTO;
import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.mapper.SwitchRedMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.SwitchRedRepository;

@Service
public class SwitchRedService {

    private final SwitchRedRepository switchRedRepository;

    public SwitchRedService(SwitchRedRepository switchRedRepository) {
        this.switchRedRepository = switchRedRepository;
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
        validarCrear(dto);
        UbicacionRed ubicacion;
        try {
            ubicacion = UbicacionRed.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + dto.getUbicacion(), ex);
        }

        SwitchRed sw = new SwitchRed();
        sw.setNombre(dto.getNombre().trim());
        sw.setMarca(blankToNull(dto.getMarca()));
        sw.setModelo(blankToNull(dto.getModelo()));
        sw.setIp(blankToNull(dto.getIp()));
        sw.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
        sw.setCantidadPuertos(dto.getCantidadPuertos());
        sw.setTipo(blankToNull(dto.getTipo()));
        sw.setVlans(dto.getVlans() != null ? dto.getVlans() : List.of());
        sw.setUbicacion(ubicacion);
        sw.setFechaAlta(dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now());

        String id = switchRedRepository.create(sw);
        return SwitchRedMapper.toDTO(switchRedRepository.findById(id));
    }

    public SwitchRedDTO cambiarEstado(String id, String estadoRaw, String motivo)
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
        switchRedRepository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
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

    public SwitchRedDTO update(String id, SwitchRedCreateDTO dto) throws ExecutionException, InterruptedException {
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

        java.util.Map<String, Object> campos = new java.util.HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToNull(dto.getMarca()));
        campos.put("modelo", blankToNull(dto.getModelo()));
        campos.put("ip", blankToNull(dto.getIp()));
        campos.put("numero_serie", blankToNull(dto.getNumeroSerie()));
        campos.put("sitio", blankToNull(dto.getSitio()));
        campos.put("ip_publica", blankToNull(dto.getIpPublica()));
        campos.put("estado", blankToNull(dto.getEstadoOmada())); 
        campos.put("version", blankToNull(dto.getVersion()));
        campos.put("mac_uplink", blankToNull(dto.getMacUplink()));
        campos.put("salto", dto.getSalto());
        campos.put("cantidad_puertos", dto.getCantidadPuertos());
        campos.put("tipo", blankToNull(dto.getTipo()));
        campos.put("vlans", dto.getVlans() != null ? dto.getVlans() : List.of());
        campos.put("ubicacion", ubicacion.name());
        
        LocalDate fecha = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        campos.put("fecha_alta", fecha.toString()); 

        switchRedRepository.update(id, campos);

        return obtenerPorId(id);
    }
}
