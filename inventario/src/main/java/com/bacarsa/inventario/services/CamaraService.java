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
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.util.FirestoreDocumentId;

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

    public List<CamaraDTO> listarCamaras(String ubicacionRaw, String nvrIdRaw) throws ExecutionException, InterruptedException {
        boolean tieneUbicacion = ubicacionRaw != null && !ubicacionRaw.isBlank();
        boolean tieneNvrId = nvrIdRaw != null && !nvrIdRaw.isBlank();
        
        if (!tieneUbicacion && !tieneNvrId) {
            // Ninguno: todas las cámaras
            return listarTodas();
        } else if (tieneNvrId && !tieneUbicacion) {
            // Solo NVR
            return camaraRepository.findByNvrId(nvrIdRaw.trim()).stream()
                    .map(CamaraMapper::toDTO)
                    .collect(Collectors.toList());
        } else if (tieneUbicacion && !tieneNvrId) {
            // Solo ubicación
            return camaraRepository.findByUbicacion(ubicacionRaw.trim()).stream()
                    .map(CamaraMapper::toDTO)
                    .collect(Collectors.toList());
        } else {
            // Ambos: filtrar por NVR primero, luego por ubicación en memoria
            return camaraRepository.findByNvrId(nvrIdRaw.trim()).stream()
                    .filter(c -> ubicacionRaw.trim().equals(c.getUbicacion()))
                    .map(CamaraMapper::toDTO)
                    .collect(Collectors.toList());
        }
    }

    public CamaraDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return CamaraMapper.toDTO(camaraRepository.findById(id));
    }

    public CamaraDTO actualizarUbicacion(String id, String ubicacionRaw)
            throws ExecutionException, InterruptedException {
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
        if (camaraRepository.findById(id) == null) {
            return null;
        }
        camaraRepository.updateUbicacion(id, ubicacionRaw.trim());
        return obtenerPorId(id);
    }

    public CamaraDTO crear(CamaraCreateDTO dto) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        String idDoc = FirestoreDocumentId.sanitizar(dto.getDispositivo());
        if (idDoc == null || idDoc.isBlank()) {
            throw new IllegalArgumentException("El dispositivo (ID) es obligatorio y debe ser válido");
        }

        Camara camara = new Camara();
        camara.setNombre(dto.getNombre().trim());
        camara.setMarca(blankToNull(dto.getMarca()));
        camara.setDescripcion(blankToNull(dto.getDescripcion()));
        camara.setResponsable(blankToNull(dto.getResponsable()));
        camara.setUbicacion(dto.getUbicacion().trim());
        camara.setDireccionIp(blankToNull(dto.getDireccionIp()));
        camara.setPuerto(dto.getPuerto());
        camara.setTipo(blankToNull(dto.getTipo()));
        camara.setNvrId(blankToNull(dto.getNvrId()));
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        camara.setFechaAlta(fa.toString());

        camaraRepository.guardarConId(idDoc, camara);
        return CamaraMapper.toDTO(camaraRepository.findById(idDoc));
    }

    private static void validarCrear(CamaraCreateDTO dto) {
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
        if (dto.getDispositivo() == null || dto.getDispositivo().isBlank()) {
            throw new IllegalArgumentException("El dispositivo (ID) es obligatorio");
        }
    }

    public CamaraDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        Camara cam = camaraRepository.findById(id);
        if (cam == null) {
            return null;
        }
        String trimmed = estadoRaw == null ? "" : estadoRaw.trim();
        EstadoOperativo estadoOperativo;
        if ("DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(cam.getResponsable());
        } else {
            try {
                estadoOperativo = EstadoOperativo.valueOf(trimmed);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado inválido: " + estadoRaw, ex);
            }
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

    public CamaraDTO asignarNvr(String idCamara, String idNvr)
            throws ExecutionException, InterruptedException {
        Camara cam = camaraRepository.findById(idCamara);
        if (cam == null) {
            return null;
        }
        
        String nvrId = idNvr == null ? null : idNvr.trim();
        
        // Permitir null/blank para desasignar NVR
        camaraRepository.updateNvrId(idCamara, nvrId);
        
        return obtenerPorId(idCamara);
    }

    /** Elimina el documento de la cámara en Firestore. */
    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (camaraRepository.findById(id) == null) {
            return false;
        }
        camaraRepository.deleteById(id);
        return true;
    }

}
