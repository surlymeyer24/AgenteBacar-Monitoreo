package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ActualizarPerifericoDTO;
import com.bacarsa.inventario.dto.ComboCreateDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.EspecificacionStockDTO;
import com.bacarsa.inventario.dto.PerifericoManualCreateDTO;
import com.bacarsa.inventario.dto.PerifericoManualDTO;
import com.bacarsa.inventario.dto.SacarUnidadStockDTO;
import com.bacarsa.inventario.dto.SacarUnidadStockResultDTO;
import com.bacarsa.inventario.mapper.EspecificacionStockMapper;
import com.bacarsa.inventario.mapper.PerifericoManualMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

@Service
public class PerifericoManualService {

    private static final String UBICACION_STOCK_DEFAULT = "stock";

    private final PerifericoManualRepository repository;
    private final ComputadoraService computadoraService;
    private final ComputadoraRepository computadoraRepository;
    private final Firestore firestore;
    private final String computadorasCollection;
    private final String perifericosCollection;

    public PerifericoManualService(PerifericoManualRepository repository,
            ComputadoraService computadoraService,
            ComputadoraRepository computadoraRepository,
            Firestore firestore,
            @Value("${firebase.collection.computadoras}") String computadorasCollection,
            @Value("${firebase.collection.perifericos_manuales}") String perifericosCollection) {
        this.repository = repository;
        this.computadoraService = computadoraService;
        this.computadoraRepository = computadoraRepository;
        this.firestore = firestore;
        this.computadorasCollection = computadorasCollection;
        this.perifericosCollection = perifericosCollection;
    }

    public List<PerifericoManualDTO> listar() throws ExecutionException, InterruptedException {
        return repository.findAll().stream()
                .map(PerifericoManualMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PerifericoManualDTO obtenerPorId(String id) throws ExecutionException, InterruptedException {
        return PerifericoManualMapper.toDTO(repository.findById(id));
    }

    public PerifericoManualDTO crear(PerifericoManualCreateDTO dto)
            throws ExecutionException, InterruptedException {
        if (dto.getTipo() == null || dto.getTipo().isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }
        if ("computadora".equalsIgnoreCase(dto.getTipo().trim()) && dto.getEspecificacionStock() == null) {
            throw new IllegalArgumentException("Especificación de hardware obligatoria para stock de PCs");
        }

        PerifericoManual p = new PerifericoManual();
        p.setTipo(dto.getTipo().trim());
        p.setCantidad(dto.getCantidad() > 0 ? dto.getCantidad() : 1);
        p.setNombre(blankToNull(dto.getNombre()));
        p.setFabricante(blankToNull(dto.getFabricante()));
        p.setConexion(blankToNull(dto.getConexion()));
        p.setComputadoraHostname(blankToNull(dto.getComputadoraHostname()));
        p.setUbicacion(blankToNull(dto.getUbicacion()));
        p.setNotas(blankToNull(dto.getNotas()));
        p.setComboId(blankToNull(dto.getComboId()));
        p.setComboNombre(blankToNull(dto.getComboNombre()));
        p.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
        aplicarEspecificacionStock(p, dto.getTipo(), dto.getEspecificacionStock());
        LocalDate fa = dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now();
        p.setFechaAlta(fa.toString());

        String id = repository.create(p);

        String motivoAlta = (dto.getMotivo() != null && !dto.getMotivo().isBlank())
                ? dto.getMotivo().trim()
                : "Alta de periférico";
        cambiarEstado(id, "DERIVAR_ASIGNACION", motivoAlta);

        return obtenerPorId(id);
    }

    public PerifericoManualDTO actualizar(String id, ActualizarPerifericoDTO dto)
            throws ExecutionException, InterruptedException {
        if (repository.findById(id) == null) return null;
        Map<String, Object> campos = new HashMap<>();
        if (dto.getTipo() != null && !dto.getTipo().isBlank())
            campos.put("tipo", dto.getTipo().trim());
        if (dto.getCantidad() != null && dto.getCantidad() > 0)
            campos.put("cantidad", dto.getCantidad());
        campos.put("nombre", dto.getNombre() != null && !dto.getNombre().isBlank() ? dto.getNombre().trim() : null);
        campos.put("fabricante", dto.getFabricante() != null && !dto.getFabricante().isBlank() ? dto.getFabricante().trim() : null);
        campos.put("conexion", dto.getConexion() != null && !dto.getConexion().isBlank() ? dto.getConexion().trim() : null);
        campos.put("computadoraHostname", dto.getComputadoraHostname() != null && !dto.getComputadoraHostname().isBlank() ? dto.getComputadoraHostname().trim() : null);
        campos.put("ubicacion", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : null);
        campos.put("notas", dto.getNotas() != null && !dto.getNotas().isBlank() ? dto.getNotas().trim() : null);
        if (dto.getFechaAlta() != null)
            campos.put("fechaAlta", dto.getFechaAlta().toString());
        if (dto.getComboId() != null)
            campos.put("comboId", dto.getComboId().isBlank() ? null : dto.getComboId().trim());
        if (dto.getComboNombre() != null)
            campos.put("comboNombre", dto.getComboNombre().isBlank() ? null : dto.getComboNombre().trim());
        if (dto.getNumeroSerie() != null)
            campos.put("numero_serie", dto.getNumeroSerie().isBlank() ? null : dto.getNumeroSerie().trim());
        if (dto.getEspecificacionStock() != null) {
            EspecificacionStock spec = EspecificacionStockMapper.fromDTO(dto.getEspecificacionStock());
            if (spec == null) {
                campos.put("especificacion_stock", FieldValue.delete());
            } else {
                validarEspecificacionPcSiAplica(
                        dto.getTipo() != null ? dto.getTipo() : repository.findById(id).getTipo(),
                        spec);
                campos.put("especificacion_stock", EspecificacionStockMapper.toFirestoreMap(spec));
            }
        }
        repository.actualizar(id, campos);
        return obtenerPorId(id);
    }

    public List<PerifericoManualDTO> crearCombo(ComboCreateDTO dto)
            throws ExecutionException, InterruptedException {
        String comboId = UUID.randomUUID().toString();
        String comboNombre = dto.getComboNombre() != null ? dto.getComboNombre().trim() : null;
        List<PerifericoManualDTO> resultado = new ArrayList<>();
        for (PerifericoManualCreateDTO item : dto.getItems()) {
            item.setComboId(comboId);
            item.setComboNombre(comboNombre);
            resultado.add(crear(item));
        }
        return resultado;
    }

    public void eliminar(String id) throws ExecutionException, InterruptedException {
        repository.eliminar(id);
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true),
            @CacheEvict(value = "perifericosManuales", allEntries = true)
    })
    public SacarUnidadStockResultDTO sacarUnidad(String loteId, SacarUnidadStockDTO dto)
            throws ExecutionException, InterruptedException {

        String pcUuid = UUID.randomUUID().toString();

        firestore.runTransaction(transaction -> {
            // --- READ lote ---
            DocumentReference loteRef = firestore.collection(perifericosCollection).document(loteId);
            DocumentSnapshot loteDoc = transaction.get(loteRef).get();
            if (!loteDoc.exists()) {
                throw new IllegalArgumentException("Ítem de stock no encontrado");
            }

            String tipo = loteDoc.getString("tipo");
            if (tipo == null || !"computadora".equalsIgnoreCase(tipo.trim())) {
                throw new IllegalArgumentException("Solo se puede sacar unidad de ítems de stock de PCs");
            }

            Long cantidad = loteDoc.getLong("cantidad");
            if (cantidad == null || cantidad <= 0) {
                throw new IllegalArgumentException("No quedan unidades disponibles en este lote");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> estadoActualMap = (Map<String, Object>) loteDoc.get("estadoActual");
            String estadoNombre = estadoActualMap != null ? (String) estadoActualMap.get("nombre") : null;
            if (!EstadoOperativo.SIN_ASIGNAR.getNombre().equalsIgnoreCase(estadoNombre)) {
                throw new IllegalArgumentException("El lote no está disponible en stock");
            }
            String compUuid = loteDoc.getString("computadora_uuid");
            String compHost = loteDoc.getString("computadoraHostname");
            if ((compUuid != null && !compUuid.isBlank()) || (compHost != null && !compHost.isBlank())) {
                throw new IllegalArgumentException("El lote no está disponible en stock");
            }

            EspecificacionStock spec = EspecificacionStockMapper.fromFirestoreMap(loteDoc.get("especificacion_stock"));
            if (spec == null) {
                throw new IllegalArgumentException("El lote no tiene especificación de hardware; editá el ítem y cargá CPU/RAM");
            }

            // --- Resolver hostname ---
            String hostname;
            if (dto.getHostname() != null && !dto.getHostname().isBlank()) {
                hostname = dto.getHostname().trim();
            } else {
                String base = EspecificacionStockMapper.buildNombreResumen(spec);
                if (base == null || base.isBlank()) {
                    base = loteDoc.getString("nombre");
                }
                if (base == null || base.isBlank()) {
                    base = "PC-STOCK";
                }
                String slug = base.replaceAll("[^a-zA-Z0-9]+", "-").replaceAll("^-+|-+$", "");
                if (slug.length() > 28) {
                    slug = slug.substring(0, 28);
                }
                String sufijo = loteId.length() >= 4
                        ? loteId.substring(loteId.length() - 4)
                        : loteId;
                hostname = slug + "-" + sufijo;
            }

            // --- Ubicación stock ---
            String loteUbicacion = loteDoc.getString("ubicacion");
            String ubicacionStock = (loteUbicacion != null && !loteUbicacion.isBlank())
                    ? loteUbicacion.trim()
                    : UBICACION_STOCK_DEFAULT;

            String motivo = (dto.getMotivo() != null && !dto.getMotivo().isBlank())
                    ? dto.getMotivo().trim()
                    : "Ingreso a stock desde lote " + loteId;

            // --- BUILD PC document ---
            Timestamp ahora = Timestamp.now();

            Map<String, Object> estadoMap = new HashMap<>();
            estadoMap.put("nombre", EstadoOperativo.SIN_ASIGNAR.getNombre());
            estadoMap.put("descripcion", EstadoOperativo.SIN_ASIGNAR.getDescripcion());

            Map<String, Object> historialEntry = new HashMap<>();
            historialEntry.put("estado", estadoMap);
            historialEntry.put("motivo", motivo);
            historialEntry.put("fechaHoraInicio", ahora);
            historialEntry.put("fechaHoraFin", null);
            historialEntry.put("ubicacion_stock", ubicacionStock);

            Map<String, Object> pcData = new HashMap<>();
            pcData.put("uuid", pcUuid);
            pcData.put("hostname", hostname);
            pcData.put("origen_alta", OrigenAlta.STOCK.name());
            pcData.put("estado_conciliacion", EstadoConciliacion.SIN_BASELINE.name());
            pcData.put("estadoActual", estadoMap);
            pcData.put("historialEstados", List.of(historialEntry));
            pcData.put("ubicacion_stock", ubicacionStock);
            pcData.put("lote_origen_id", loteId);
            pcData.put("especificacion_esperada", EspecificacionStockMapper.toFirestoreMap(spec));

            if (spec.getTipoEquipo() != null && !spec.getTipoEquipo().isBlank()) {
                Map<String, Object> te = new HashMap<>();
                te.put("tipo", spec.getTipoEquipo());
                pcData.put("tipo_equipo", te);
            }
            if (spec.getCondicion() != null && !spec.getCondicion().isBlank()) {
                pcData.put("condicion", spec.getCondicion());
            }

            // --- WRITE PC ---
            DocumentReference pcRef = firestore.collection(computadorasCollection).document(pcUuid);
            transaction.set(pcRef, pcData);

            // --- DECREMENT lote ---
            transaction.update(loteRef, "cantidad", FieldValue.increment(-1));

            return null;
        }).get();

        // Post-transacción: leer datos frescos para el DTO de respuesta
        SacarUnidadStockResultDTO result = new SacarUnidadStockResultDTO();
        result.setComputadora(computadoraService.getByUuid(pcUuid));
        result.setLote(obtenerPorId(loteId));
        return result;
    }

    public List<PerifericoManualDTO> listarPorComputadoraUuid(String computadoraUuid)
            throws ExecutionException, InterruptedException {
        if (computadoraUuid == null || computadoraUuid.isBlank()) {
            return List.of();
        }
        return repository.findByComputadoraUuid(computadoraUuid.trim()).stream()
                .map(PerifericoManualMapper::toDTO)
                .collect(Collectors.toList());
    }

    public PerifericoManualDTO asignar(String id, String computadoraUuid, String motivo)
            throws ExecutionException, InterruptedException {
        PerifericoManual original = repository.findById(id);
        if (original == null) return null;

        String uuid = computadoraUuid.trim();
        if (uuid.isBlank()) {
            throw new IllegalArgumentException("UUID de computadora obligatorio");
        }

        Computadora pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            throw new IllegalArgumentException("Computadora no encontrada: " + uuid);
        }
        String hostname = pc.getHostname();
        if (hostname == null || hostname.isBlank()) {
            throw new IllegalArgumentException("La PC no tiene hostname");
        }

        String motivoFinal = (motivo != null && !motivo.isBlank()) ? motivo.trim() : "Asignado desde stock";

        if (original.getCantidad() > 1) {
            repository.decrementarCantidad(id);

            PerifericoManual asignado = new PerifericoManual();
            asignado.setTipo(original.getTipo());
            asignado.setCantidad(1);
            asignado.setNombre(original.getNombre());
            asignado.setFabricante(original.getFabricante());
            asignado.setConexion(original.getConexion());
            asignado.setComputadoraUuid(uuid);
            asignado.setComputadoraHostname(hostname);
            asignado.setNotas(original.getNotas());
            asignado.setFechaAlta(original.getFechaAlta());
            asignado.setComboId(original.getComboId());
            asignado.setComboNombre(original.getComboNombre());
            asignado.setEspecificacionStock(original.getEspecificacionStock());
            asignado.setNumeroSerie(original.getNumeroSerie());

            String nuevoId = repository.create(asignado);
            cambiarEstado(nuevoId, "ASIGNADA", motivoFinal);
            return obtenerPorId(nuevoId);
        } else {
            repository.updateAsignacionPc(id, uuid, hostname);
            return cambiarEstado(id, "ASIGNADA", motivoFinal);
        }
    }

    public PerifericoManualDTO cambiarEstado(String id, String estadoRaw, String motivo)
            throws ExecutionException, InterruptedException {
        PerifericoManual p = repository.findById(id);
        if (p == null) return null;

        String trimmed = estadoRaw == null ? "" : estadoRaw.trim();
        EstadoOperativo estadoOperativo;
        if ("DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(p.getComputadoraHostname());
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
        repository.cambiarEstado(id, estado, motivo);
        return obtenerPorId(id);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static void aplicarEspecificacionStock(PerifericoManual p, String tipo, EspecificacionStockDTO dto) {
        EspecificacionStock spec = EspecificacionStockMapper.fromDTO(dto);
        if (spec != null) {
            validarEspecificacionPcSiAplica(tipo, spec);
            p.setEspecificacionStock(spec);
        }
    }

    private static void validarEspecificacionPcSiAplica(String tipo, EspecificacionStock spec) {
        if (tipo == null || !"computadora".equalsIgnoreCase(tipo.trim())) return;
        if (spec.getCpuModelo() == null || spec.getCpuModelo().isBlank()) {
            throw new IllegalArgumentException("CPU es obligatoria para stock de PCs");
        }
        if (spec.getRamTotalGb() == null || spec.getRamTotalGb() <= 0) {
            throw new IllegalArgumentException("RAM (GB) es obligatoria y debe ser mayor a 0 para stock de PCs");
        }
    }

    private static boolean esLotePcEnStock(PerifericoManual lote) {
        Estado estado = lote.getEstadoActual();
        if (estado == null || estado.getNombre() == null
                || !EstadoOperativo.SIN_ASIGNAR.getNombre().equalsIgnoreCase(estado.getNombre())) {
            return false;
        }
        return (lote.getComputadoraUuid() == null || lote.getComputadoraUuid().isBlank())
                && (lote.getComputadoraHostname() == null || lote.getComputadoraHostname().isBlank());
    }

    private static String resolverHostname(PerifericoManual lote, SacarUnidadStockDTO dto) {
        if (dto.getHostname() != null && !dto.getHostname().isBlank()) {
            return dto.getHostname().trim();
        }
        String base = EspecificacionStockMapper.buildNombreResumen(lote.getEspecificacionStock());
        if (base == null || base.isBlank()) {
            base = lote.getNombre();
        }
        if (base == null || base.isBlank()) {
            base = "PC-STOCK";
        }
        String slug = base.replaceAll("[^a-zA-Z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (slug.length() > 28) {
            slug = slug.substring(0, 28);
        }
        String sufijo = lote.getId() == null ? "0000" : lote.getId().substring(Math.max(0, lote.getId().length() - 4));
        return slug + "-" + sufijo;
    }
}
