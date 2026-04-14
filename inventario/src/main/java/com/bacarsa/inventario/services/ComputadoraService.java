package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class ComputadoraService {

    private final ComputadoraRepository computadoraRepository;

    public ComputadoraService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public List<ComputadoraDTO> getAllComputadoras() throws ExecutionException, InterruptedException {
        return computadoraRepository.findAll().stream()
                .map(ComputadoraMapper::toListDTO)
                .collect(Collectors.toList());
    }

    public ComputadoraDTO getByUuid(String uuid) throws ExecutionException, InterruptedException {
        return ComputadoraMapper.toDTO(computadoraRepository.findByUuid(uuid));
    }

    public ComputadoraDTO actualizarUbicacion(String uuid, String ubicacionRaw)
            throws ExecutionException, InterruptedException {
        Ubicacion ubicacion;
        try {
            ubicacion = Ubicacion.valueOf(ubicacionRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación inválida: " + ubicacionRaw, ex);
        }
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }
        computadoraRepository.updateUbicacion(uuid, ubicacion);
        return getByUuid(uuid);
    }

    public ComputadoraDTO cambiarEstado(String uuid, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        EstadoOperativo estadoOperativo;
        try {
            estadoOperativo = EstadoOperativo.valueOf(estadoRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
        }
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }
        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        computadoraRepository.cambiarEstado(uuid, estado, motivo);
        return getByUuid(uuid);
    }
}
