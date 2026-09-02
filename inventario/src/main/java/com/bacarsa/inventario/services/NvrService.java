package com.bacarsa.inventario.services;

import org.springframework.stereotype.Service;
import com.bacarsa.inventario.dto.NvrDTO;
import com.bacarsa.inventario.dto.NvrMapper;
import com.bacarsa.inventario.dto.NvrCreateDTO;
import com.bacarsa.inventario.repository.NvrRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import com.bacarsa.inventario.models.Nvr;
import com.bacarsa.inventario.util.FirestoreDocumentId;


@Service
public class NvrService {

    private final NvrRepository nvrRepository;
    private final CamaraRepository camaraRepository;

    public NvrService(NvrRepository nvrRepository, CamaraRepository camaraRepository) {
        this.nvrRepository = nvrRepository;
        this.camaraRepository = camaraRepository;
    }

    public List<NvrDTO> listarTodas() throws ExecutionException, InterruptedException {
        Map<String, Long> conteoPorNvr = camaraRepository.contarCamarasPorNvrId();
        return nvrRepository.findAll().stream()
                .map(n -> {
                    NvrDTO dto = NvrMapper.toDTO(n);
                    long nC = conteoPorNvr.getOrDefault(n.getId(), 0L);
                    dto.setCantidadCamaras(nC > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) nC);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public NvrDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        Nvr n = nvrRepository.findById(id);
        if (n == null) {
            return null;
        }
        NvrDTO dto = NvrMapper.toDTO(n);
        dto.setCantidadCamaras(camaraRepository.contarPorNvrId(id));
        return dto;
    }

    public NvrDTO crear(NvrCreateDTO dto) throws ExecutionException, InterruptedException {
        if (dto.getDispositivo() == null) {
            throw new IllegalArgumentException("El identificador del dispositivo es obligatorio");
        }
        String id = dto.getDispositivo().trim();
        if (id.isBlank()) {
            throw new IllegalArgumentException("El identificador del dispositivo es obligatorio");
        }
        if (nvrRepository.findById(id) != null) {
            throw new IllegalArgumentException("Ya existe una NVR con el mismo identificador");
        }
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        Nvr nvr = new Nvr();
        nvr.setId(id);
        nvr.setNombre(dto.getNombre().trim());
        nvr.setDireccionIp(dto.getDireccionIp());
        nvr.setPuerto(dto.getPuerto());
        nvr.setDescripcion(dto.getDescripcion());
        nvr.setUsuario(blankToNull(dto.getUsuario()));
        nvr.setPassword(blankToNull(dto.getPassword()));
        nvrRepository.guardarConId(id, nvr);
        return obtenerPorId(id);
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    public NvrDTO update(String id, NvrCreateDTO dto) throws ExecutionException, InterruptedException {
        Nvr nvrExistente = nvrRepository.findById(id);
        if (nvrExistente == null) {
            throw new IllegalArgumentException("NVR no encontrada: " + id);
        }
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }

        Map<String, Object> campos = new java.util.HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("direccionIp", blankToNull(dto.getDireccionIp()));
        campos.put("puerto", dto.getPuerto());
        campos.put("descripcion", blankToNull(dto.getDescripcion()));
        campos.put("usuario", blankToNull(dto.getUsuario()));
        campos.put("password", blankToNull(dto.getPassword()));

        nvrRepository.update(id, campos);

        return obtenerPorId(id);
    }
}
