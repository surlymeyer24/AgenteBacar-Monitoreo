package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AccessPointCreateDTO;
import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.mapper.AccessPointMapper;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;

@Service
public class AccessPointService {

    private final AccessPointRepository accessPointRepository;

    public AccessPointService(AccessPointRepository accessPointRepository) {
        this.accessPointRepository = accessPointRepository;
    }

    public List<AccessPointDTO> listarTodos() throws ExecutionException, InterruptedException {
        return accessPointRepository.findAll().stream()
                .map(AccessPointMapper::toDTO)
                .collect(Collectors.toList());
    }

    public AccessPointDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return AccessPointMapper.toDTO(accessPointRepository.findById(id));
    }

    public AccessPointDTO crear(AccessPointCreateDTO dto) throws ExecutionException, InterruptedException {
        validar(dto);
        UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());

        AccessPoint ap = new AccessPoint();
        ap.setNombre(dto.getNombre().trim());
        ap.setMarca(blankToNull(dto.getMarca()));
        ap.setModelo(blankToNull(dto.getModelo()));
        ap.setIp(blankToNull(dto.getIp()));
        ap.setMac(blankToNull(dto.getMac()));
        ap.setSwitchUplink(blankToNull(dto.getSwitchUplink()));
        ap.setUbicacion(ubicacion);
        ap.setEstado(blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "OPERATIVO");

        String id = accessPointRepository.create(ap);
        return obtenerPorId(id);
    }

    public AccessPointDTO update(String id, AccessPointCreateDTO dto) throws ExecutionException, InterruptedException {
        if (accessPointRepository.findById(id) == null) {
            throw new IllegalArgumentException("Access Point no encontrado: " + id);
        }
        validar(dto);
        UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());

        java.util.Map<String, Object> campos = new java.util.HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToNull(dto.getMarca()));
        campos.put("modelo", blankToNull(dto.getModelo()));
        campos.put("ip", blankToNull(dto.getIp()));
        campos.put("mac", blankToNull(dto.getMac()));
        campos.put("switch_uplink", blankToNull(dto.getSwitchUplink()));
        campos.put("ubicacion", ubicacion.name());
        campos.put("estado", blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "OPERATIVO");

        accessPointRepository.update(id, campos);
        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (accessPointRepository.findById(id) == null) {
            return false;
        }
        accessPointRepository.deleteById(id);
        return true;
    }

    private static void validar(AccessPointCreateDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
    }

    private static UbicacionRed parseUbicacion(String raw) {
        try {
            return UbicacionRed.valueOf(raw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + raw, ex);
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
