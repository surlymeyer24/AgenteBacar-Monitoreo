package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CelularCreateDTO;
import com.bacarsa.inventario.dto.CelularDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.CelularHistorialReglas;
import com.bacarsa.inventario.mapper.CelularMapper;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.EstadoCelular;
import com.bacarsa.inventario.models.RenglonHistorial;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@Service
public class CelularService {

    private final CelularRepository celularRepository;
    private final UsuarioRepository usuarioRepository;

    public CelularService(CelularRepository celularRepository, UsuarioRepository usuarioRepository) {
        this.celularRepository = celularRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<CelularDTO> listarTodos() throws ExecutionException, InterruptedException {
        return celularRepository.findAll().stream()
                .map(CelularMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CelularDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return CelularMapper.toDTO(celularRepository.findById(id));
    }

    public CelularDTO crear(CelularCreateDTO dto) throws ExecutionException, InterruptedException {
        return crear(dto, null);
    }

    public CelularDTO crear(CelularCreateDTO dto, String uid) throws ExecutionException, InterruptedException {
        validar(dto, true);
        validarImeiUnico(dto.getImei(), null);
        Celular celular = fromDto(dto);

        ActorHistorial actor = actorDe(uid);
        RenglonHistorial altaRenglon = new RenglonHistorial();
        altaRenglon.setTipo("ALTA_MANUAL");
        altaRenglon.setActoId(UUID.randomUUID().toString());
        altaRenglon.setCuando(Timestamp.now());
        altaRenglon.setOrigen("MANUAL");
        altaRenglon.setQuienUid(actor.uid());
        altaRenglon.setQuienNombre(actor.nombre());
        celular.setHistorial(new ArrayList<>(List.of(altaRenglon)));

        String id = celularRepository.create(celular);
        return obtenerPorId(id);
    }

    public CelularDTO update(String id, CelularCreateDTO dto)
            throws ExecutionException, InterruptedException {
        return update(id, dto, null);
    }

    public CelularDTO update(String id, CelularCreateDTO dto, String uid)
            throws ExecutionException, InterruptedException {
        if (celularRepository.findById(id) == null) {
            throw new IllegalArgumentException("Celular no encontrado: " + id);
        }
        validar(dto, false);
        validarImeiUnico(dto.getImei(), id);

        Map<String, Object> updates = toUpdateMap(dto);
        ActorHistorial actor = actorDe(uid);
        celularRepository.aplicarHistorial(id, (doc, ahora) ->
            CelularHistorialReglas.editarFicha(doc, updates, actor, ahora)
        );

        return obtenerPorId(id);
    }

    public boolean eliminar(String id) throws ExecutionException, InterruptedException {
        if (celularRepository.findById(id) == null) {
            return false;
        }
        celularRepository.deleteById(id);
        return true;
    }

    private ActorHistorial actorDe(String uid) {
        if (uid == null || uid.isBlank()) {
            return ActorHistorial.SISTEMA;
        }
        try {
            return usuarioRepository.findById(uid)
                    .map(u -> new ActorHistorial(uid, u.getNombre()))
                    .orElseGet(() -> new ActorHistorial(uid, uid));
        } catch (Exception e) {
            return new ActorHistorial(uid, uid);
        }
    }

    private void validarImeiUnico(String imei, String idActual)
            throws ExecutionException, InterruptedException {
        String normalizado = normalizarImei(imei);
        boolean duplicado = celularRepository.findAll().stream()
                .filter(celular -> idActual == null || !idActual.equals(celular.getId()))
                .map(Celular::getImei)
                .filter(valor -> valor != null && !valor.isBlank())
                .map(CelularService::normalizarImeiExistente)
                .anyMatch(normalizado::equalsIgnoreCase);
        if (duplicado) {
            throw new IllegalArgumentException("Ya existe un celular con el IMEI " + normalizado);
        }
    }

    private static void validar(CelularCreateDTO dto, boolean esAlta) {
        if (dto.getMarca() == null || dto.getMarca().isBlank()) {
            throw new IllegalArgumentException("La marca es obligatoria");
        }
        if (dto.getModelo() == null || dto.getModelo().isBlank()) {
            throw new IllegalArgumentException("El modelo es obligatorio");
        }
        normalizarImei(dto.getImei());
        if (dto.getConCargador() == null) {
            throw new IllegalArgumentException("Debe indicar si el celular tiene cargador");
        }
        parseCondicion(dto.getCondicion());
        if (!esAlta || (dto.getEstado() != null && !dto.getEstado().isBlank())) {
            parseEstado(dto.getEstado());
        }
    }

    private static Celular fromDto(CelularCreateDTO dto) {
        Celular celular = new Celular();
        celular.setMarca(dto.getMarca().trim());
        celular.setModelo(dto.getModelo().trim());
        celular.setImei(normalizarImei(dto.getImei()));
        celular.setConCargador(dto.getConCargador());
        celular.setCondicion(parseCondicion(dto.getCondicion()));
        celular.setLineaNumero(blankToNull(dto.getLineaNumero()));
        celular.setResponsable(blankToNull(dto.getResponsable()));
        celular.setArea(areaODeposito(dto.getArea()));
        celular.setEstado(dto.getEstado() == null || dto.getEstado().isBlank()
                ? EstadoCelular.en_stock.name()
                : parseEstado(dto.getEstado()).name());
        return celular;
    }

    private static Map<String, Object> toUpdateMap(CelularCreateDTO dto) {
        Map<String, Object> campos = new HashMap<>();
        campos.put("marca", dto.getMarca().trim());
        campos.put("modelo", dto.getModelo().trim());
        campos.put("imei", normalizarImei(dto.getImei()));
        campos.put("con_cargador", dto.getConCargador());
        campos.put("condicion", parseCondicion(dto.getCondicion()));
        campos.put("linea_numero", blankToNull(dto.getLineaNumero()));
        campos.put("responsable", blankToNull(dto.getResponsable()));
        campos.put("area", areaODeposito(dto.getArea()));
        campos.put("estado", parseEstado(dto.getEstado()).name());
        return campos;
    }

    private static String parseCondicion(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("La condición es obligatoria");
        }
        String normalizada = raw.trim().toLowerCase(Locale.ROOT);
        if (!"nuevo".equals(normalizada) && !"usado".equals(normalizada)) {
            throw new IllegalArgumentException("Condición inválida: " + raw
                    + " (valores: nuevo, usado)");
        }
        return normalizada;
    }

    private static EstadoCelular parseEstado(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }
        String normalized = raw.trim().toLowerCase()
                .replace(' ', '_')
                .replace('-', '_');
        if ("enstock".equals(normalized)) {
            normalized = "en_stock";
        }
        try {
            return EstadoCelular.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + raw
                    + " (valores: activo, en_stock, baja)", ex);
        }
    }

    private static String normalizarImei(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("El IMEI es obligatorio");
        }
        String normalizado = raw.trim().replaceAll("[\\s-]", "");
        if (!normalizado.matches("\\d+")) {
            throw new IllegalArgumentException("El IMEI solo puede contener dígitos");
        }
        return normalizado;
    }

    private static String normalizarImeiExistente(String raw) {
        String normalizado = raw.trim().replaceAll("[\\s-]", "");
        return normalizado.matches("\\d+") ? normalizado : raw.trim();
    }

    private static String areaODeposito(String area) {
        return area == null || area.isBlank() ? "Depósito" : area.trim();
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
