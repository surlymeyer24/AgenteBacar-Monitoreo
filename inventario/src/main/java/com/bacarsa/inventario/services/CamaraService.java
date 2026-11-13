package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CamaraCreateDTO;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.CamaraHistorialReglas;
import com.bacarsa.inventario.mapper.CamaraMapper;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.bacarsa.inventario.security.CredencialCryptoService;
import com.bacarsa.inventario.util.FirestoreDocumentId;

@Service
public class CamaraService {

    private final CamaraRepository camaraRepository;
    private final CredencialCryptoService cryptoService;
    private final UsuarioRepository usuarioRepository;

    public CamaraService(CamaraRepository camaraRepository,
                         CredencialCryptoService cryptoService,
                         UsuarioRepository usuarioRepository) {
        this.camaraRepository = camaraRepository;
        this.cryptoService = cryptoService;
        this.usuarioRepository = usuarioRepository;
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

    private CamaraDTO aDto(Camara camara) {
        if (camara == null) {
            return null;
        }
        CamaraDTO dto = CamaraMapper.toDTO(camara);
        if (dto != null && dto.getPassword() != null) {
            dto.setPassword(cryptoService.descifrar(dto.getPassword()));
        }
        return dto;
    }

    public List<CamaraDTO> listarTodas() throws ExecutionException, InterruptedException {
        return camaraRepository.findAll().stream()
                .map(this::aDto)
                .collect(Collectors.toList());
    }

    public List<CamaraDTO> getRecientes(int limit) throws ExecutionException, InterruptedException {
        return camaraRepository.findAll().stream()
                .limit(limit)
                .map(this::aDto)
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
                    .map(this::aDto)
                    .collect(Collectors.toList());
        } else if (tieneUbicacion && !tieneNvrId) {
            // Solo ubicación
            return camaraRepository.findByUbicacion(ubicacionRaw.trim()).stream()
                    .map(this::aDto)
                    .collect(Collectors.toList());
        } else {
            // Ambos: filtrar por NVR primero, luego por ubicación en memoria
            return camaraRepository.findByNvrId(nvrIdRaw.trim()).stream()
                    .filter(c -> ubicacionRaw.trim().equals(c.getUbicacion()))
                    .map(this::aDto)
                    .collect(Collectors.toList());
        }
    }

    public CamaraDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return aDto(camaraRepository.findById(id));
    }

    public CamaraDTO actualizarUbicacion(String id, String ubicacionRaw)
            throws ExecutionException, InterruptedException {
        return actualizarUbicacion(id, ubicacionRaw, null);
    }

    public CamaraDTO actualizarUbicacion(String id, String ubicacionRaw, String uid)
            throws ExecutionException, InterruptedException {
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
        if (camaraRepository.findById(id) == null) {
            return null;
        }
        ActorHistorial actor = resolverActor(uid);
        Map<String, Object> campos = Map.of("ubicacion", ubicacionRaw.trim());
        camaraRepository.aplicarHistorial(id, (actual, ahora) ->
                CamaraHistorialReglas.edicionFicha(actual, campos, actor, ahora));
        return obtenerPorId(id);
    }

    public CamaraDTO crear(CamaraCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public CamaraDTO crear(CamaraCreateDTO dto, String uid) throws ExecutionException, InterruptedException {
        validarCrear(dto);
        String idDoc = FirestoreDocumentId.sanitizar(dto.getDispositivo());
        if (idDoc == null || idDoc.isBlank()) {
            throw new IllegalArgumentException("El dispositivo (ID) es obligatorio y debe ser válido");
        }

        Map<String, Object> campos = new HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToNull(dto.getMarca()));
        campos.put("descripcion", blankToNull(dto.getDescripcion()));
        campos.put("responsable", blankToNull(dto.getResponsable()));
        campos.put("ubicacion", dto.getUbicacion().trim());
        campos.put("direccionIp", blankToNull(dto.getDireccionIp()));
        campos.put("puerto", dto.getPuerto());
        campos.put("tipo", blankToNull(dto.getTipo()));
        campos.put("nvrId", blankToNull(dto.getNvrId()));
        campos.put("usuario", blankToNull(dto.getUsuario()));
        campos.put("password", cryptoService.cifrar(blankToNull(dto.getPassword())));
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        campos.put("fechaAlta", fa.toString());

        ActorHistorial actor = resolverActor(uid);
        camaraRepository.aplicarHistorial(idDoc, (actual, ahora) ->
                CamaraHistorialReglas.altaManual(idDoc, campos, actor, ahora));
        return obtenerPorId(idDoc);
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
        return cambiarEstado(id, estadoRaw, motivo, null);
    }

    public CamaraDTO cambiarEstado(String id, String estadoRaw, String motivo, String uid)
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

        ActorHistorial actor = resolverActor(uid);
        camaraRepository.aplicarHistorial(id, (actual, ahora) ->
                CamaraHistorialReglas.cambioEstado(actual, estado, motivo, actor, ahora));
        return obtenerPorId(id);
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    public CamaraDTO update(String id, CamaraCreateDTO dto) throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public CamaraDTO update(String id, CamaraCreateDTO dto, String uid) throws ExecutionException, InterruptedException {
        Camara camExistente = camaraRepository.findById(id);
        if (camExistente == null) {
            throw new IllegalArgumentException("Cámara no encontrada: " + id);
        }

        validarCrear(dto);

        Map<String, Object> campos = new HashMap<>();
        campos.put("nombre", dto.getNombre().trim());
        campos.put("marca", blankToNull(dto.getMarca()));
        campos.put("descripcion", blankToNull(dto.getDescripcion()));
        campos.put("responsable", blankToNull(dto.getResponsable()));
        campos.put("ubicacion", dto.getUbicacion().trim());
        campos.put("direccionIp", blankToNull(dto.getDireccionIp()));
        campos.put("puerto", dto.getPuerto());
        campos.put("tipo", blankToNull(dto.getTipo()));
        campos.put("nvrId", blankToNull(dto.getNvrId()));
        campos.put("usuario", blankToNull(dto.getUsuario()));
        campos.put("password", cryptoService.cifrar(blankToNull(dto.getPassword())));
        
        LocalDate fecha = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        campos.put("fechaAlta", fecha.toString()); 

        ActorHistorial actor = resolverActor(uid);
        camaraRepository.aplicarHistorial(id, (actual, ahora) ->
                CamaraHistorialReglas.edicionFicha(actual, campos, actor, ahora));

        return obtenerPorId(id);
    }

    public CamaraDTO asignarNvr(String idCamara, String idNvr)
            throws ExecutionException, InterruptedException {
        return asignarNvr(idCamara, idNvr, null);
    }

    public CamaraDTO asignarNvr(String idCamara, String idNvr, String uid)
            throws ExecutionException, InterruptedException {
        Camara cam = camaraRepository.findById(idCamara);
        if (cam == null) {
            return null;
        }
        
        String nvrId = idNvr == null ? "" : idNvr.trim();
        ActorHistorial actor = resolverActor(uid);
        Map<String, Object> campos = Map.of("nvrId", nvrId);
        camaraRepository.aplicarHistorial(idCamara, (actual, ahora) ->
                CamaraHistorialReglas.edicionFicha(actual, campos, actor, ahora));
        
        return obtenerPorId(idCamara);
    }

    /** Baja lógica de la cámara: preserva el documento y registra el renglón inmutable de baja. */
    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        return eliminar(id, null);
    }

    public boolean eliminar(String id, String uid) throws ExecutionException, InterruptedException {
        if (camaraRepository.findById(id) == null) {
            return false;
        }
        cambiarEstado(id, "BAJA", "Baja de equipo solicitada por usuario", uid);
        return true;
    }

}
