package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.NvrCreateDTO;
import com.bacarsa.inventario.dto.NvrDTO;
import com.bacarsa.inventario.dto.NvrMapper;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.NvrHistorialReglas;
import com.bacarsa.inventario.models.Nvr;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.NvrRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.bacarsa.inventario.security.CredencialCryptoService;

@Service
public class NvrService {

    private final NvrRepository nvrRepository;
    private final CamaraRepository camaraRepository;
    private final CredencialCryptoService cryptoService;
    private final UsuarioRepository usuarioRepository;

    public NvrService(NvrRepository nvrRepository, CamaraRepository camaraRepository,
                      CredencialCryptoService cryptoService, UsuarioRepository usuarioRepository) {
        this.nvrRepository = nvrRepository;
        this.camaraRepository = camaraRepository;
        this.cryptoService = cryptoService;
        this.usuarioRepository = usuarioRepository;
    }

    private NvrDTO aDto(Nvr n) {
        if (n == null) return null;
        NvrDTO dto = NvrMapper.toDTO(n);
        if (dto != null && dto.getPassword() != null) {
            dto.setPassword(cryptoService.descifrar(dto.getPassword()));
        }
        return dto;
    }

    public List<NvrDTO> listarTodas() throws ExecutionException, InterruptedException {
        Map<String, Long> conteoPorNvr = camaraRepository.contarCamarasPorNvrId();
        return nvrRepository.findAll().stream()
                .map(n -> {
                    NvrDTO dto = aDto(n);
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
        NvrDTO dto = aDto(n);
        dto.setCantidadCamaras(camaraRepository.contarPorNvrId(id));
        return dto;
    }

    public NvrDTO crear(NvrCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public NvrDTO crear(NvrCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
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

        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nombre", dto.getNombre().trim());
        if (blankToNull(dto.getDireccionIp()) != null) cuerpo.put("direccionIp", dto.getDireccionIp().trim());
        if (dto.getPuerto() != null) cuerpo.put("puerto", dto.getPuerto());
        if (blankToNull(dto.getDescripcion()) != null) cuerpo.put("descripcion", dto.getDescripcion().trim());
        if (blankToNull(dto.getUsuario()) != null) cuerpo.put("usuario", dto.getUsuario().trim());
        if (blankToNull(dto.getPassword()) != null) {
            cuerpo.put("password", cryptoService.cifrar(dto.getPassword().trim()));
        }
        cuerpo.put("estado", "activo");

        ActorHistorial actor = resolverActor(actorUid);

        nvrRepository.aplicarHistorial(id, (doc, ahora) ->
                NvrHistorialReglas.altaManual(id, cuerpo, actor, ahora));

        return obtenerPorId(id);
    }

    public NvrDTO update(String id, NvrCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public NvrDTO update(String id, NvrCreateDTO dto, String actorUid) throws ExecutionException, InterruptedException {
        Nvr nvrExistente = nvrRepository.findById(id);
        if (nvrExistente == null) {
            throw new IllegalArgumentException("NVR no encontrada: " + id);
        }
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }

        Map<String, Object> campos = new HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("direccionIp", blankToNull(dto.getDireccionIp()));
        campos.put("puerto", dto.getPuerto());
        campos.put("descripcion", blankToNull(dto.getDescripcion()));
        campos.put("usuario", blankToNull(dto.getUsuario()));
        if (blankToNull(dto.getPassword()) != null) {
            campos.put("password", cryptoService.cifrar(dto.getPassword().trim()));
        }

        ActorHistorial actor = resolverActor(actorUid);

        nvrRepository.aplicarHistorial(id, (doc, ahora) ->
                NvrHistorialReglas.edicionFicha(doc, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public NvrDTO cambiarEstado(String id, String estado, String motivo)
            throws ExecutionException, InterruptedException {
        return cambiarEstado(id, estado, motivo, null);
    }

    public NvrDTO cambiarEstado(String id, String estado, String motivo, String actorUid)
            throws ExecutionException, InterruptedException {
        if (nvrRepository.findById(id) == null) {
            return null;
        }
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }

        ActorHistorial actor = resolverActor(actorUid);

        nvrRepository.aplicarHistorial(id, (doc, ahora) ->
                NvrHistorialReglas.cambioEstado(doc, estado.trim(), motivo, actor, ahora));

        return obtenerPorId(id);
    }

    /**
     * Baja lógica de la NVR: preserva el documento y su historial inmutable
     * registrando el cambio a estado inactivo.
     */
    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String actorUid) throws ExecutionException, InterruptedException {
        if (nvrRepository.findById(id) == null) {
            return false;
        }
        cambiarEstado(id, "inactivo", "Baja de NVR solicitada por usuario", actorUid);
        return true;
    }

    private ActorHistorial resolverActor(String uid) {
        if (uid == null || uid.isBlank()) {
            return ActorHistorial.SISTEMA;
        }
        try {
            return usuarioRepository.findById(uid)
                    .map(u -> new ActorHistorial(u.getId(), u.getNombre() != null ? u.getNombre() : u.getEmail()))
                    .orElseGet(() -> new ActorHistorial(uid, ""));
        } catch (Exception ex) {
            return new ActorHistorial(uid, "");
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
