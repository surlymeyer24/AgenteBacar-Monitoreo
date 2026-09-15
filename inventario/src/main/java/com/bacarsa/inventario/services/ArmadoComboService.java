package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ArmarComboDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.PerifericoManualDTO;
import com.bacarsa.inventario.exception.ApiConflictException;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.mapper.EspecificacionStockMapper;
import com.bacarsa.inventario.mapper.PerifericoManualMapper;
import com.bacarsa.inventario.models.BaselineEsperado;
import com.bacarsa.inventario.models.BaselinePerifericoEsperado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoPreparacion;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.util.BaselineNormalizacionHelper;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

@Service
public class ArmadoComboService {

    private static final Set<String> TIPOS_ARMADO = Set.of("monitor", "mouse", "teclado");

    private final Firestore firestore;
    private final String computadorasCollection;
    private final String perifericosCollection;
    private final ComputadoraRepository computadoraRepository;
    private final PerifericoManualRepository perifericoManualRepository;

    public ArmadoComboService(
            Firestore firestore,
            @Value("${firebase.collection.computadoras}") String computadorasCollection,
            @Value("${firebase.collection.perifericos_manuales}") String perifericosCollection,
            ComputadoraRepository computadoraRepository,
            PerifericoManualRepository perifericoManualRepository) {
        this.firestore = firestore;
        this.computadorasCollection = computadorasCollection;
        this.perifericosCollection = perifericosCollection;
        this.computadoraRepository = computadoraRepository;
        this.perifericoManualRepository = perifericoManualRepository;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true),
            @CacheEvict(value = "perifericosManuales", allEntries = true)
    })
    public ComputadoraDTO armarCombo(String computadoraUuid, ArmarComboDTO dto)
            throws ExecutionException, InterruptedException {
        if (computadoraUuid == null || computadoraUuid.isBlank()) {
            throw new IllegalArgumentException("UUID de computadora obligatorio");
        }
        validarDtoIds(dto);

        List<SeleccionPeriferico> selecciones = construirSelecciones(dto);
        String comboId = UUID.randomUUID().toString();

        firestore.runTransaction(transaction -> {
            DocumentReference pcRef = firestore.collection(computadorasCollection).document(computadoraUuid);
            DocumentSnapshot pcDoc = transaction.get(pcRef).get();
            if (!pcDoc.exists()) {
                throw new IllegalArgumentException("Computadora no encontrada: " + computadoraUuid);
            }
            validarPcParaArmado(pcDoc);

            ArmarComboDTO effectiveDto = completarDtoDesdeSpec(pcDoc, dto);
            validarDtoContenido(effectiveDto, selecciones);
            String motivoHistorial = construirMotivoHistorial(dto, selecciones);

            String hostname = pcDoc.getString("hostname");
            if (hostname == null || hostname.isBlank()) {
                throw new IllegalArgumentException("La PC no tiene hostname");
            }

            List<BaselinePerifericoEsperado> baselinePerifs = new ArrayList<>();
            CollectionReference perifCol = firestore.collection(perifericosCollection);

            for (SeleccionPeriferico sel : selecciones) {
                DocumentReference perifRef = perifCol.document(sel.id());
                DocumentSnapshot perifDoc = transaction.get(perifRef).get();
                BaselinePerifericoEsperado snap = asignarPerifericoEnTransaccion(
                        transaction, perifRef, perifDoc, sel.tipoEsperado(), computadoraUuid, hostname,
                        comboId, motivoHistorial, perifCol);
                baselinePerifs.add(snap);
            }

            BaselineEsperado baseline = construirBaseline(effectiveDto, baselinePerifs);
            Map<String, Object> pcUpdates = new HashMap<>();
            pcUpdates.put("baseline_esperado", baselineToMap(baseline));
            pcUpdates.put("combo_esperado_id", comboId);
            pcUpdates.put("estado_conciliacion", EstadoConciliacion.BASELINE_LISTO.name());
            pcUpdates.put("estado_preparacion", EstadoPreparacion.ARMADO.name());
            pcUpdates.put("historialEstados", appendHistorialPc(transaction, pcDoc, motivoHistorial));
            transaction.update(pcRef, pcUpdates);
            return null;
        }).get();

        Computadora pc = computadoraRepository.findByUuid(computadoraUuid);
        return ComputadoraMapper.toDTO(pc);
    }

    public List<PerifericoManualDTO> listarPerifericosStockDisponibles(List<String> tiposFiltro)
            throws ExecutionException, InterruptedException {
        Set<String> tiposNorm = normalizarTiposFiltro(tiposFiltro);
        return perifericoManualRepository.findAll().stream()
                .filter(p -> esPerifericoEnStock(p))
                .filter(p -> tiposNorm.isEmpty() || tiposNorm.contains(normalizarTipo(p.getTipo())))
                .map(PerifericoManualMapper::toDTO)
                .toList();
    }

    private static void validarDtoIds(ArmarComboDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Body obligatorio");
        }
        List<String> ids = new ArrayList<>();
        agregarIdSiPresente(ids, dto.getMonitorId());
        agregarIdSiPresente(ids, dto.getMouseId());
        agregarIdSiPresente(ids, dto.getTecladoId());
        if (ids.size() != new HashSet<>(ids).size()) {
            throw new IllegalArgumentException("No se puede usar el mismo periférico en más de un rol");
        }
    }

    private static void validarDtoContenido(ArmarComboDTO dto, List<SeleccionPeriferico> selecciones) {
        boolean tienePerif = !selecciones.isEmpty();
        boolean tieneHw = notBlank(dto.getCpuModelo())
                || dto.getRamTotalGb() != null
                || notBlank(dto.getDiscoResumen());
        if (!tienePerif && !tieneHw) {
            throw new IllegalArgumentException("Indicá al menos un periférico o un dato de hardware esperado");
        }
    }

    private static ArmarComboDTO completarDtoDesdeSpec(DocumentSnapshot pcDoc, ArmarComboDTO dto) {
        ArmarComboDTO effective = new ArmarComboDTO();
        effective.setMonitorId(dto.getMonitorId());
        effective.setMouseId(dto.getMouseId());
        effective.setTecladoId(dto.getTecladoId());
        effective.setMotivo(dto.getMotivo());

        EspecificacionStock spec = EspecificacionStockMapper.fromFirestoreMap(pcDoc.get("especificacion_esperada"));
        effective.setCpuModelo(notBlank(dto.getCpuModelo()) ? dto.getCpuModelo().trim()
                : (spec != null ? spec.getCpuModelo() : null));
        effective.setRamTotalGb(dto.getRamTotalGb() != null ? dto.getRamTotalGb()
                : (spec != null ? spec.getRamTotalGb() : null));
        effective.setDiscoResumen(notBlank(dto.getDiscoResumen()) ? dto.getDiscoResumen().trim()
                : (spec != null ? spec.getDiscoResumen() : null));
        return effective;
    }

    private static List<SeleccionPeriferico> construirSelecciones(ArmarComboDTO dto) {
        List<SeleccionPeriferico> list = new ArrayList<>();
        if (notBlank(dto.getMonitorId())) {
            list.add(new SeleccionPeriferico(dto.getMonitorId().trim(), "monitor"));
        }
        if (notBlank(dto.getMouseId())) {
            list.add(new SeleccionPeriferico(dto.getMouseId().trim(), "mouse"));
        }
        if (notBlank(dto.getTecladoId())) {
            list.add(new SeleccionPeriferico(dto.getTecladoId().trim(), "teclado"));
        }
        return list;
    }

    private static void validarPcParaArmado(DocumentSnapshot pcDoc) {
        String origen = pcDoc.getString("origen_alta");
        if (!OrigenAlta.STOCK.name().equals(origen)) {
            throw new ApiConflictException("Solo se puede armar combo en PCs con origen STOCK");
        }
        String conciliacion = pcDoc.getString("estado_conciliacion");
        if (!EstadoConciliacion.SIN_BASELINE.name().equals(conciliacion)) {
            throw new ApiConflictException("La PC ya tiene baseline armado o no admite armado");
        }
        String estadoNombre = extraerEstadoNombre(pcDoc);
        if (!EstadoOperativo.SIN_ASIGNAR.getNombre().equalsIgnoreCase(estadoNombre)) {
            throw new ApiConflictException("La PC debe estar en estado Sin Asignar para armar combo");
        }
    }

    private BaselinePerifericoEsperado asignarPerifericoEnTransaccion(
            Transaction transaction,
            DocumentReference perifRef,
            DocumentSnapshot perifDoc,
            String tipoEsperado,
            String computadoraUuid,
            String hostname,
            String comboId,
            String motivo,
            CollectionReference perifCol) {
        if (!perifDoc.exists()) {
            throw new IllegalArgumentException("Periférico no encontrado: " + perifRef.getId());
        }
        String tipo = normalizarTipo(perifDoc.getString("tipo"));
        if (!tipoEsperado.equals(tipo)) {
            throw new IllegalArgumentException("El periférico " + perifRef.getId() + " no es de tipo " + tipoEsperado);
        }
        if (!TIPOS_ARMADO.contains(tipo)) {
            throw new IllegalArgumentException("Tipo de periférico no admitido en armado: " + tipo);
        }
        if (!esSinAsignar(perifDoc)) {
            throw new ApiConflictException("Periférico no disponible en stock: " + perifRef.getId());
        }
        String uuidAsignado = perifDoc.getString("computadora_uuid");
        if (uuidAsignado != null && !uuidAsignado.isBlank()) {
            throw new ApiConflictException("Periférico ya vinculado a otra PC: " + perifRef.getId());
        }
        String hostnameAsignado = perifDoc.getString("computadora_hostname");
        if (hostnameAsignado == null) hostnameAsignado = perifDoc.getString("computadoraHostname");
        if (hostnameAsignado != null && !hostnameAsignado.isBlank()) {
            throw new ApiConflictException("Periférico ya asignado: " + perifRef.getId());
        }

        int cantidad = leerCantidad(perifDoc);
        if (cantidad < 1) {
            throw new ApiConflictException("Sin stock disponible para periférico: " + perifRef.getId());
        }

        String idStockFinal;
        if (cantidad > 1) {
            transaction.update(perifRef, "cantidad", cantidad - 1);
            DocumentReference nuevoRef = perifCol.document();
            idStockFinal = nuevoRef.getId();
            Map<String, Object> nuevoDoc = copiarPerifericoParaAsignacion(perifDoc, computadoraUuid, hostname, comboId);
            nuevoDoc.put("cantidad", 1);
            nuevoDoc.put("historialEstados", historialAsignada(motivo));
            nuevoDoc.put("estadoActual", estadoMapAsignada());
            transaction.set(nuevoRef, nuevoDoc);
        } else {
            idStockFinal = perifRef.getId();
            Map<String, Object> updates = new HashMap<>();
            updates.put("computadora_uuid", computadoraUuid);
            updates.put("computadora_hostname", hostname);
            updates.put("comboId", comboId);
            updates.put("historialEstados", cerrarYAgregarHistorial(perifDoc, motivo, true));
            updates.put("estadoActual", estadoMapAsignada());
            transaction.update(perifRef, updates);
        }

        BaselinePerifericoEsperado esperado = new BaselinePerifericoEsperado();
        esperado.setTipo(tipo);
        esperado.setIdStock(idStockFinal);
        esperado.setNombre(perifDoc.getString("nombre"));
        esperado.setFabricante(perifDoc.getString("fabricante"));
        String numeroSerie = perifDoc.getString("numero_serie");
        if (numeroSerie != null && !numeroSerie.isBlank()) {
            esperado.setNumeroSerie(numeroSerie.trim());
        }
        return esperado;
    }

    private static BaselineEsperado construirBaseline(ArmarComboDTO dto, List<BaselinePerifericoEsperado> perifs) {
        BaselineEsperado baseline = new BaselineEsperado();
        baseline.setCpuModelo(BaselineNormalizacionHelper.normalizarTextoHw(dto.getCpuModelo()));
        baseline.setRamTotalGb(BaselineNormalizacionHelper.normalizarRamGb(dto.getRamTotalGb()));
        baseline.setDiscoResumen(BaselineNormalizacionHelper.normalizarTextoHw(dto.getDiscoResumen()));
        baseline.setPerifericos(perifs);
        baseline.setArmadoAt(Timestamp.now());
        baseline.setArmadoPor(null);
        return baseline;
    }

    private static Map<String, Object> baselineToMap(BaselineEsperado baseline) {
        Map<String, Object> map = new HashMap<>();
        if (baseline.getCpuModelo() != null) {
            map.put("cpu_modelo", baseline.getCpuModelo());
        }
        if (baseline.getRamTotalGb() != null) {
            map.put("ram_total_gb", baseline.getRamTotalGb());
        }
        if (baseline.getDiscoResumen() != null) {
            map.put("disco_resumen", baseline.getDiscoResumen());
        }
        if (baseline.getArmadoAt() != null) {
            map.put("armado_at", baseline.getArmadoAt());
        }
        if (baseline.getArmadoPor() != null) {
            map.put("armado_por", baseline.getArmadoPor());
        }
        List<Map<String, Object>> perifs = new ArrayList<>();
        if (baseline.getPerifericos() != null) {
            for (BaselinePerifericoEsperado p : baseline.getPerifericos()) {
                Map<String, Object> pm = new HashMap<>();
                pm.put("tipo", p.getTipo());
                pm.put("id_stock", p.getIdStock());
                if (p.getNombre() != null) pm.put("nombre", p.getNombre());
                if (p.getFabricante() != null) pm.put("fabricante", p.getFabricante());
                if (p.getNumeroSerie() != null) pm.put("numero_serie", p.getNumeroSerie());
                perifs.add(pm);
            }
        }
        map.put("perifericos", perifs);
        return map;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> appendHistorialPc(
            Transaction transaction, DocumentSnapshot pcDoc, String motivo) {
        List<Map<String, Object>> historial = copiarHistorial(pcDoc.get("historialEstados"));
        Timestamp ahora = Timestamp.now();
        cerrarEntradasAbiertas(historial, ahora);

        Map<String, Object> estadoMap = estadoMapSinAsignar();
        Object estadoActualObj = pcDoc.get("estadoActual");
        if (estadoActualObj instanceof Map<?, ?> em) {
            estadoMap = new HashMap<>();
            for (Map.Entry<?, ?> e : em.entrySet()) {
                if (e.getKey() != null) {
                    estadoMap.put(String.valueOf(e.getKey()), e.getValue());
                }
            }
        }

        Map<String, Object> nuevaEntrada = new HashMap<>();
        nuevaEntrada.put("estado", estadoMap);
        nuevaEntrada.put("motivo", motivo);
        nuevaEntrada.put("fechaHoraInicio", ahora);
        nuevaEntrada.put("fechaHoraFin", null);
        historial.add(nuevaEntrada);
        return historial;
    }

    private static Map<String, Object> copiarPerifericoParaAsignacion(
            DocumentSnapshot src, String uuid, String hostname, String comboId) {
        Map<String, Object> doc = new HashMap<>();
        copiarSiPresente(src, doc, "tipo");
        copiarSiPresente(src, doc, "nombre");
        copiarSiPresente(src, doc, "fabricante");
        copiarSiPresente(src, doc, "conexion");
        copiarSiPresente(src, doc, "ubicacion");
        copiarSiPresente(src, doc, "notas");
        copiarSiPresente(src, doc, "fechaAlta");
        copiarSiPresente(src, doc, "comboNombre");
        copiarSiPresente(src, doc, "numero_serie");
        copiarSiPresente(src, doc, "especificacion_stock");
        copiarSiPresente(src, doc, "lote_origen_id");
        doc.putIfAbsent("lote_origen_id", src.getId());
        doc.put("computadora_uuid", uuid);
        doc.put("computadora_hostname", hostname);
        doc.put("comboId", comboId);
        return doc;
    }

    private static void copiarSiPresente(DocumentSnapshot src, Map<String, Object> dest, String field) {
        Object val = src.get(field);
        if (val != null) {
            dest.put(field, val);
        }
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> historialAsignada(String motivo) {
        List<Map<String, Object>> historial = new ArrayList<>();
        Timestamp ahora = Timestamp.now();
        Map<String, Object> entrada = new HashMap<>();
        entrada.put("estado", estadoMapAsignada());
        entrada.put("motivo", motivo);
        entrada.put("fechaHoraInicio", ahora);
        entrada.put("fechaHoraFin", null);
        historial.add(entrada);
        return historial;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> cerrarYAgregarHistorial(
            DocumentSnapshot doc, String motivo, boolean asignada) {
        List<Map<String, Object>> historial = copiarHistorial(doc.get("historialEstados"));
        Timestamp ahora = Timestamp.now();
        cerrarEntradasAbiertas(historial, ahora);
        Map<String, Object> entrada = new HashMap<>();
        entrada.put("estado", asignada ? estadoMapAsignada() : estadoMapSinAsignar());
        entrada.put("motivo", motivo);
        entrada.put("fechaHoraInicio", ahora);
        entrada.put("fechaHoraFin", null);
        historial.add(entrada);
        return historial;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorial(Object raw) {
        List<Map<String, Object>> historial = new ArrayList<>();
        if (!(raw instanceof List<?> lista)) {
            return historial;
        }
        for (Object item : lista) {
            if (!(item instanceof Map<?, ?> m)) continue;
            Map<String, Object> entrada = new HashMap<>();
            for (Map.Entry<?, ?> e : m.entrySet()) {
                if (e.getKey() != null) {
                    entrada.put(String.valueOf(e.getKey()), e.getValue());
                }
            }
            historial.add(entrada);
        }
        return historial;
    }

    private static void cerrarEntradasAbiertas(List<Map<String, Object>> historial, Timestamp ahora) {
        for (int i = 0; i < historial.size(); i++) {
            Map<String, Object> entrada = historial.get(i);
            if (entrada.get("fechaHoraFin") == null) {
                Map<String, Object> copia = new HashMap<>(entrada);
                copia.put("fechaHoraFin", ahora);
                historial.set(i, copia);
            }
        }
    }

    private static Map<String, Object> estadoMapAsignada() {
        Map<String, Object> m = new HashMap<>();
        m.put("nombre", EstadoOperativo.ASIGNADA.getNombre());
        m.put("descripcion", EstadoOperativo.ASIGNADA.getDescripcion());
        return m;
    }

    private static Map<String, Object> estadoMapSinAsignar() {
        Map<String, Object> m = new HashMap<>();
        m.put("nombre", EstadoOperativo.SIN_ASIGNAR.getNombre());
        m.put("descripcion", EstadoOperativo.SIN_ASIGNAR.getDescripcion());
        return m;
    }

    private static boolean esPerifericoEnStock(com.bacarsa.inventario.models.PerifericoManual p) {
        if (p.getEstadoActual() == null) {
            return p.getComputadoraHostname() == null || p.getComputadoraHostname().isBlank();
        }
        return EstadoOperativo.SIN_ASIGNAR.getNombre().equalsIgnoreCase(p.getEstadoActual().getNombre())
                && (p.getComputadoraUuid() == null || p.getComputadoraUuid().isBlank())
                && (p.getComputadoraHostname() == null || p.getComputadoraHostname().isBlank());
    }

    private static Set<String> normalizarTiposFiltro(List<String> tipos) {
        Set<String> out = new HashSet<>();
        if (tipos == null) {
            return out;
        }
        for (String t : tipos) {
            if (t != null && !t.isBlank()) {
                out.add(t.trim().toLowerCase());
            }
        }
        return out;
    }

    private static String normalizarTipo(String tipo) {
        return tipo == null ? "" : tipo.trim().toLowerCase();
    }

    private static boolean esSinAsignar(DocumentSnapshot doc) {
        return EstadoOperativo.SIN_ASIGNAR.getNombre().equalsIgnoreCase(extraerEstadoNombre(doc));
    }

    @SuppressWarnings("unchecked")
    private static String extraerEstadoNombre(DocumentSnapshot doc) {
        Object estadoActualObj = doc.get("estadoActual");
        if (estadoActualObj instanceof Map<?, ?> em) {
            Object nombre = em.get("nombre");
            if (nombre instanceof String s) return s;
        }
        List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
        if (historial != null) {
            for (int i = historial.size() - 1; i >= 0; i--) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada.get("fechaHoraFin") != null) continue;
                Object estadoObj = entrada.get("estado");
                if (estadoObj instanceof Map<?, ?> em) {
                    Object nombre = em.get("nombre");
                    if (nombre instanceof String s) return s;
                }
            }
        }
        return null;
    }

    private static int leerCantidad(DocumentSnapshot doc) {
        Long cant = doc.getLong("cantidad");
        if (cant != null) {
            return cant.intValue();
        }
        Object raw = doc.get("cantidad");
        if (raw instanceof Number n) {
            return n.intValue();
        }
        return 1;
    }

    private static String construirMotivoHistorial(ArmarComboDTO dto, List<SeleccionPeriferico> selecciones) {
        if (dto.getMotivo() != null && !dto.getMotivo().isBlank()) {
            return dto.getMotivo().trim();
        }
        StringBuilder sb = new StringBuilder("Combo armado");
        if (!selecciones.isEmpty()) {
            sb.append(": ");
            sb.append(selecciones.stream().map(s -> s.tipoEsperado() + "=" + s.id()).reduce((a, b) -> a + ", " + b).orElse(""));
        }
        return sb.toString();
    }

    private static void agregarIdSiPresente(List<String> ids, String id) {
        if (notBlank(id)) {
            ids.add(id.trim());
        }
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private record SeleccionPeriferico(String id, String tipoEsperado) {
    }
}
