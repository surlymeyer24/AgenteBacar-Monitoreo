package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MaquinaTesoreriaCreateDTO;
import com.bacarsa.inventario.dto.MaquinaTesoreriaDTO;
import com.bacarsa.inventario.mapper.MaquinaTesoreriaMapper;
import com.bacarsa.inventario.models.CambioEstado;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.MaquinaTesoreria;
import com.bacarsa.inventario.models.TipoMaquina;
import com.bacarsa.inventario.repository.MaquinaTesoreriaRepository;
import com.google.cloud.Timestamp;

@Service
public class MaquinaTesoreriaService {

    private final MaquinaTesoreriaRepository maquinaTesoreriaRepository;

    public MaquinaTesoreriaService(MaquinaTesoreriaRepository maquinaTesoreriaRepository) {
        this.maquinaTesoreriaRepository = maquinaTesoreriaRepository;
    }

    public List<MaquinaTesoreriaDTO> listar(String tipoRaw) throws ExecutionException, InterruptedException {
        if (tipoRaw == null || tipoRaw.isBlank()) {
            return maquinaTesoreriaRepository.findAll().stream()
                    .map(MaquinaTesoreriaMapper::toDTO)
                    .collect(Collectors.toList());
        }
        TipoMaquina tipo;
        try {
            tipo = TipoMaquina.valueOf(tipoRaw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Tipo de máquina inválido: " + tipoRaw, ex);
        }
        return maquinaTesoreriaRepository.findByTipo(tipo).stream()
                .map(MaquinaTesoreriaMapper::toDTO)
                .collect(Collectors.toList());
    }

    public MaquinaTesoreriaDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return MaquinaTesoreriaMapper.toDTO(maquinaTesoreriaRepository.findById(id));
    }

    public MaquinaTesoreriaDTO crear(MaquinaTesoreriaCreateDTO dto) throws ExecutionException, InterruptedException {
        validarCrear(dto);

        TipoMaquina tipo;
        try {
            tipo = TipoMaquina.valueOf(dto.getTipo().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Tipo de máquina inválido: " + dto.getTipo(), ex);
        }

        EstadoOperativo estadoOperativo;
        try {
            estadoOperativo = EstadoOperativo.valueOf(dto.getEstado().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + dto.getEstado(), ex);
        }

        MaquinaTesoreria maquina = new MaquinaTesoreria();
        maquina.setTipo(tipo);
        maquina.setModelo(dto.getModelo().trim());
        maquina.setNroSerie(dto.getNroSerie().trim());
        maquina.setVida(blankToNull(dto.getVida()));

        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        maquina.setEstadoActual(estado);

        CambioEstado estadoInicial = new CambioEstado();
        estadoInicial.setEstado(estado);
        estadoInicial.setMotivo(blankToNull(dto.getMotivo()));
        estadoInicial.setFechaHoraInicio(Timestamp.now());
        estadoInicial.setFechaHoraFin(null);
        maquina.getHistorialEstados().add(estadoInicial);

        String id = maquinaTesoreriaRepository.create(maquina);
        return obtenerPorId(id);
    }

    public MaquinaTesoreriaDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        MaquinaTesoreria maquina = maquinaTesoreriaRepository.findById(id);
        if (maquina == null) {
            return null;
        }
        EstadoOperativo estadoOperativo;
        try {
            estadoOperativo = EstadoOperativo.valueOf(estadoRaw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
        }
        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        maquinaTesoreriaRepository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static void validarCrear(MaquinaTesoreriaCreateDTO dto) {
        if (dto.getTipo() == null || dto.getTipo().isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }
        if (dto.getModelo() == null || dto.getModelo().isBlank()) {
            throw new IllegalArgumentException("El modelo es obligatorio");
        }
        if (dto.getNroSerie() == null || dto.getNroSerie().isBlank()) {
            throw new IllegalArgumentException("El número de serie es obligatorio");
        }
        if (dto.getEstado() == null || dto.getEstado().isBlank()) {
            throw new IllegalArgumentException("El estado inicial es obligatorio");
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
