package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ServidorDTO;
import com.bacarsa.inventario.mapper.ServidorMapper;
import com.bacarsa.inventario.models.Servidor;
import com.bacarsa.inventario.repository.ServidorRepository;

@Service
public class ServidorService {

    private final ServidorRepository servidorRepository;

    public ServidorService(ServidorRepository servidorRepository) {
        this.servidorRepository = servidorRepository;
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
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        Servidor servidor = new Servidor();
        servidor.setNombre(dto.getNombre().trim());
        servidor.setHostname(blankToNull(dto.getHostname()));
        servidor.setIp(blankToNull(dto.getIp()));
        servidor.setSistemaOperativo(blankToNull(dto.getSistemaOperativo()));
        servidor.setUbicacion(blankToNull(dto.getUbicacion()));
        servidor.setDescripcion(blankToNull(dto.getDescripcion()));
        servidor.setEstado(blankToNull(dto.getEstado()));

        String id = servidorRepository.create(servidor);
        return obtenerPorId(id);
    }

    public ServidorDTO actualizar(String id, ServidorDTO dto) throws ExecutionException, InterruptedException {
        if (servidorRepository.findById(id) == null) return null;

        Map<String, Object> fields = new HashMap<>();
        if (dto.getNombre() != null) fields.put("nombre", dto.getNombre().trim());
        if (dto.getHostname() != null) fields.put("hostname", blankToNull(dto.getHostname()));
        if (dto.getIp() != null) fields.put("ip", blankToNull(dto.getIp()));
        if (dto.getSistemaOperativo() != null) fields.put("sistemaOperativo", blankToNull(dto.getSistemaOperativo()));
        if (dto.getUbicacion() != null) fields.put("ubicacion", blankToNull(dto.getUbicacion()));
        if (dto.getDescripcion() != null) fields.put("descripcion", blankToNull(dto.getDescripcion()));
        if (dto.getEstado() != null) fields.put("estado", blankToNull(dto.getEstado()));

        if (!fields.isEmpty()) servidorRepository.update(id, fields);
        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (servidorRepository.findById(id) == null) return false;
        servidorRepository.deleteById(id);
        return true;
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim();
    }
}
