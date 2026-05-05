package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.mapper.RouterMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.RouterRepository;

@Service
public class RouterService {

    private final RouterRepository routerRepository;

    public RouterService(RouterRepository routerRepository) {
        this.routerRepository = routerRepository;
    }

    public List<RouterDTO> listarTodos() throws ExecutionException, InterruptedException {
        return routerRepository.findAll().stream()
                .map(RouterMapper::toDTO)
                .collect(Collectors.toList());
    }

    public RouterDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return RouterMapper.toDTO(routerRepository.findById(id));
    }

    public RouterDTO crear(RouterCreateDTO dto) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        UbicacionRed ubicacion;
        try {
            ubicacion = UbicacionRed.valueOf(dto.getUbicacion().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + dto.getUbicacion(), ex);
        }

        Router router = new Router();
        router.setNombre(dto.getNombre().trim());
        router.setMarca(blankToNull(dto.getMarca()));
        router.setModelo(blankToNull(dto.getModelo()));
        router.setIp(blankToNull(dto.getIp()));
        router.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
        router.setFirmware(blankToNull(dto.getFirmware()));
        router.setCantidadPuertosWan(dto.getCantidadPuertosWan());
        router.setCantidadPuertosLan(dto.getCantidadPuertosLan());
        router.setGateway(blankToNull(dto.getGateway()));
        router.setUbicacion(ubicacion);
        router.setFechaAlta(dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now());

        String id = routerRepository.create(router);
        return RouterMapper.toDTO(routerRepository.findById(id));
    }

    public RouterDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        Router router = routerRepository.findById(id);
        if (router == null) {
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
        routerRepository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static void validarCrear(RouterCreateDTO dto) {
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
}
