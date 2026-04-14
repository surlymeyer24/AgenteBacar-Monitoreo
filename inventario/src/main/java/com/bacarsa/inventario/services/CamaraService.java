package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CamaraCreateDTO;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.mapper.CamaraMapper;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.UbicacionCamara;
import com.bacarsa.inventario.repository.CamaraRepository;

@Service
public class CamaraService {

    private final CamaraRepository camaraRepository;

    public CamaraService(CamaraRepository camaraRepository) {
        this.camaraRepository = camaraRepository;
    }

    public List<CamaraDTO> listarTodas() throws ExecutionException, InterruptedException {
        return camaraRepository.findAll().stream()
                .map(CamaraMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CamaraDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return CamaraMapper.toDTO(camaraRepository.findById(id));
    }

    public CamaraDTO crear(CamaraCreateDTO dto) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        UbicacionCamara ubicacion;
        try {
            ubicacion = UbicacionCamara.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de cámara inválida: " + dto.getUbicacion(), ex);
        }

        Camara camara = new Camara();
        camara.setNombre(dto.getNombre().trim());
        camara.setMarca(blankToNull(dto.getMarca()));
        camara.setDescripcion(blankToNull(dto.getDescripcion()));
        camara.setResponsable(blankToNull(dto.getResponsable()));
        camara.setUbicacion(ubicacion);
        camara.setFechaAlta(dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now());

        String id = camaraRepository.create(camara);
        return CamaraMapper.toDTO(camaraRepository.findById(id));
    }

    private static void validarCrear(CamaraCreateDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
    }

    public CamaraDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        EstadoOperativo estadoOperativo;
        try {
            estadoOperativo = EstadoOperativo.valueOf(estadoRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
        }
        if (camaraRepository.findById(id) == null) {
            return null;
        }
        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        camaraRepository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
