package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.CambioEstadoDTO;
import com.bacarsa.inventario.dto.InternoIpCreateDTO;
import com.bacarsa.inventario.dto.InternoIpDTO;
import com.bacarsa.inventario.mapper.InternoIpMapper;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.InternoIp;
import com.bacarsa.inventario.repository.InternoIpRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InternoIpService {

    private final InternoIpRepository internoIpRepository;

    public List<InternoIpDTO> findAll() throws ExecutionException, InterruptedException {
        return internoIpRepository.findAll().stream()
                .map(InternoIpMapper::toDTO)
                .collect(Collectors.toList());
    }

    public InternoIpDTO findById(String id) throws ExecutionException, InterruptedException {
        InternoIp interno = internoIpRepository.findById(id);
        if (interno == null) {
            return null;
        }
        return InternoIpMapper.toDTO(interno);
    }

    public String create(InternoIpCreateDTO dto) throws ExecutionException, InterruptedException {
        InternoIp interno = new InternoIp();
        interno.setNumeroInterno(dto.getNumeroInterno());
        interno.setAsignadoA(dto.getAsignadoA());
        interno.setDireccionIp(dto.getDireccionIp());
        interno.setMacAddress(dto.getMacAddress());
        interno.setMarcaModelo(dto.getMarcaModelo());

        return internoIpRepository.create(interno);
    }

    public int createBulk(List<InternoIpCreateDTO> dtos) throws ExecutionException, InterruptedException {
        int count = 0;
        for (InternoIpCreateDTO dto : dtos) {
            create(dto);
            count++;
        }
        return count;
    }

    public void update(String id, InternoIpCreateDTO dto) throws ExecutionException, InterruptedException {
        InternoIp existente = internoIpRepository.findById(id);
        if (existente == null) {
            throw new IllegalArgumentException("Interno IP no encontrado: " + id);
        }

        Map<String, Object> updates = new HashMap<>();
        updates.put("numero_interno", dto.getNumeroInterno());
        updates.put("asignado_a", dto.getAsignadoA());
        updates.put("direccion_ip", dto.getDireccionIp());
        updates.put("mac_address", dto.getMacAddress());
        updates.put("marca_modelo", dto.getMarcaModelo());

        internoIpRepository.update(id, updates);
    }

    public void delete(String id) throws ExecutionException, InterruptedException {
        internoIpRepository.deleteById(id);
    }

    public void cambiarEstado(String id, CambiarEstadoDTO dto) throws ExecutionException, InterruptedException {
        EstadoOperativo eo = EstadoOperativo.valueOf(dto.getEstado());
        Estado estado = new Estado();
        estado.setNombre(eo.getNombre());
        estado.setDescripcion(eo.getDescripcion());
        internoIpRepository.cambiarEstado(id, estado, dto.getMotivo());
    }
    
    public List<CambioEstadoDTO> getHistorial(String id) throws ExecutionException, InterruptedException {
        InternoIpDTO dto = findById(id);
        if (dto == null) {
            return null;
        }
        return dto.getHistorialEstados();
    }
}
