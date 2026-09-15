package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.mapper.ComputadoraListadoMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.MatchingJobEstado;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;
import com.bacarsa.inventario.models.ProcesadorDetallado;
import com.bacarsa.inventario.models.Ram;
import com.bacarsa.inventario.models.RamPlaca;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.util.AnydeskIdResolver;
import com.bacarsa.inventario.util.FirestoreComputadoraParser;
import com.bacarsa.inventario.util.FirestoreJsonHelper;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteBatch;

@Repository
public class ComputadoraRepository {

    private final Firestore firestore;
    private final String collectionName;
    private final String programasSubcollection;
    private final String tareasCollection;

    public ComputadoraRepository(Firestore firestore,
                                  @Value("${firebase.collection.computadoras}") String collectionName,
                                  @Value("${firebase.subcollection.computadora-programas:programas}")
                                  String programasSubcollection,
                                  @Value("${firebase.collection.tareas}") String tareasCollection) {
        this.firestore = firestore;
        this.collectionName = collectionName;
        this.programasSubcollection = programasSubcollection;
        this.tareasCollection = tareasCollection;
    }

    @Cacheable("computadoras-gordo")
    public List<Computadora> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(documentToComputadora(doc));
        }
        return result;
    }

    @Cacheable(value = "computadoras-gordo", key = "'ubicacion:' + #ubicacion")
    public List<Computadora> findByUbicacion(Ubicacion ubicacion) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("ubicacion", ubicacion.name())
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(documentToComputadora(doc));
        }
        return result;
    }

    @Cacheable("pc-listado")
    public List<ComputadoraListadoDTO> findAllListado() throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName)
                .select(ComputadoraListadoFields.ALL.toArray(new String[0]));
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();
        List<ComputadoraListadoDTO> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            ComputadoraListadoDTO dto = ComputadoraListadoMapper.fromSnapshot(doc);
            if (dto != null) {
                result.add(dto);
            }
        }
        return result;
    }

    @Cacheable(value = "pc-listado", key = "'ubicacion:' + #ubicacion")
    public List<ComputadoraListadoDTO> findByUbicacionListado(Ubicacion ubicacion)
            throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName)
                .whereEqualTo("ubicacion", ubicacion.name())
                .select(ComputadoraListadoFields.ALL.toArray(new String[0]));
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();
        List<ComputadoraListadoDTO> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            ComputadoraListadoDTO dto = ComputadoraListadoMapper.fromSnapshot(doc);
            if (dto != null) {
                result.add(dto);
            }
        }
        return result;
    }

    @Cacheable(value = "pc-detalle", key = "#uuid")
    public Computadora findByUuid(String uuid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(uuid).get().get();
        if (!doc.exists()) {
            return null;
        }
        return documentToComputadora(doc);
    }

    /**
     * Lista documentos de la subcolección {@code programas} del agente bajo la computadora {@code uuid}.
     */
    @Cacheable(value = "pc-programas", key = "#uuid")
    public List<Map<String, Object>> listProgramas(String uuid) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .document(uuid)
                .collection(programasSubcollection)
                .get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Map<String, Object>> out = new ArrayList<>(docs.size());
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("documentoId", doc.getId());
            Map<String, Object> data = doc.getData();
            if (data != null) {
                for (Map.Entry<String, Object> e : data.entrySet()) {
                    row.put(e.getKey(), FirestoreJsonHelper.toJsonFriendly(e.getValue()));
                }
            }
            out.add(row);
        }
        return out;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public String create(Computadora computadora) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(computadora.getUuid());
        ref.set(computadora).get();
        return computadora.getUuid();
    }

    /**
     * Elimina la computadora y los documentos de la subcolección {@code programas}.
     * En Firestore borrar el documento padre no elimina subcolecciones automáticamente.
     *
     * @return {@code true} si existía el documento y se eliminó
     */
    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "pc-programas", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public boolean deleteByUuid(String uuid) throws ExecutionException, InterruptedException {
        DocumentReference pcRef = firestore.collection(collectionName).document(uuid);
        DocumentSnapshot snap = pcRef.get().get();
        if (!snap.exists()) {
            return false;
        }
        CollectionReference progRef = pcRef.collection(programasSubcollection);
        List<QueryDocumentSnapshot> progDocs = progRef.get().get().getDocuments();
        final int batchMax = 500;
        for (int i = 0; i < progDocs.size(); i += batchMax) {
            WriteBatch batch = firestore.batch();
            int end = Math.min(i + batchMax, progDocs.size());
            for (int j = i; j < end; j++) {
                batch.delete(progDocs.get(j).getReference());
            }
            batch.commit().get();
        }
        pcRef.delete().get();
        return true;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void agregarImpresora(String uuid, ImpresoraFirestore impresora) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.impresoras", FieldValue.arrayUnion(toMap(impresora)))
                .get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void agregarMonitor(String uuid, MonitorFirestore monitor) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.monitores", FieldValue.arrayUnion(toMap(monitor)))
                .get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void agregarDispositivoUsb(String uuid, DispositivoUsbFirestore usb) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.dispositivos_usb", FieldValue.arrayUnion(toMap(usb)))
                .get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void agregarAudioEntrada(String uuid, DispositivoAudioFirestore audio) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.audio.entrada", FieldValue.arrayUnion(toMap(audio)))
                .get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void agregarAudioSalida(String uuid, DispositivoAudioFirestore audio) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.audio.salida", FieldValue.arrayUnion(toMap(audio)))
                .get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void updateUbicacion(String uuid, Ubicacion ubicacion) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid).update("ubicacion", ubicacion.name()).get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public Computadora actualizarDatosStock(String uuid, com.bacarsa.inventario.dto.ComputadoraStockUpdateDTO dto,
            Ubicacion ubicacion)
            throws ExecutionException, InterruptedException {
        if (dto == null) {
            return null;
        }
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);
        DocumentSnapshot snap = docRef.get().get();
        if (!snap.exists()) {
            return null;
        }
        Map<String, Object> updates = buildStockFieldUpdates(snap, dto.getSistemaOperativo(),
                dto.getTipoEquipo(), dto.getCondicion(), ubicacion, dto.getUbicacionStock(),
                dto.getEspecificacionEsperada(), dto.getDescripcionStock(), dto.getHostname());

        if (!updates.isEmpty()) {
            docRef.update(updates).get();
        }
        return documentToComputadora(docRef.get().get());
    }

    private Map<String, Object> buildStockFieldUpdates(DocumentSnapshot existingDoc, String sistemaOperativo,
            String tipoEquipoRaw, String condicion, Ubicacion ubicacion, String ubicacionStock,
            com.bacarsa.inventario.dto.EspecificacionStockDTO especificacionEsperada,
            String descripcionStock, String hostname) {
        Map<String, Object> updates = new HashMap<>();

        if (sistemaOperativo != null) {
            updates.put("sistema_operativo",
                    sistemaOperativo.isBlank() ? FieldValue.delete() : sistemaOperativo);
        }
        if (tipoEquipoRaw != null) {
            if (tipoEquipoRaw.isBlank()) {
                updates.put("tipo_equipo", FieldValue.delete());
            } else {
                Map<String, Object> te = new HashMap<>();
                te.put("tipo", tipoEquipoRaw);
                if (existingDoc != null && existingDoc.exists()) {
                    Object existing = existingDoc.get("tipo_equipo");
                    if (existing instanceof Map<?, ?> m && m.get("tiene_bateria") != null) {
                        te.put("tiene_bateria", m.get("tiene_bateria"));
                    }
                }
                updates.put("tipo_equipo", te);
            }
        }
        if (condicion != null) {
            updates.put("condicion", condicion.isBlank() ? FieldValue.delete() : condicion);
        }
        if (ubicacion != null) {
            updates.put("ubicacion", ubicacion.name());
        }
        if (ubicacionStock != null) {
            updates.put("ubicacion_stock",
                    ubicacionStock.isBlank() ? FieldValue.delete() : ubicacionStock);
        }
        if (especificacionEsperada != null) {
            var spec = com.bacarsa.inventario.mapper.EspecificacionStockMapper.fromDTO(especificacionEsperada);
            if (spec == null) {
                updates.put("especificacion_esperada", FieldValue.delete());
            } else {
                updates.put("especificacion_esperada",
                        com.bacarsa.inventario.mapper.EspecificacionStockMapper.toFirestoreMap(spec));
            }
        }
        if (descripcionStock != null) {
            updates.put("descripcion_stock",
                    descripcionStock.isBlank() ? FieldValue.delete() : descripcionStock.trim());
        }
        if (hostname != null && !hostname.isBlank()) {
            updates.put("hostname", hostname.trim());
        }
        return updates;
    }

    @Cacheable(value = "pc-detalle", key = "'hostname:' + #hostname")
    public Computadora findByHostname(String hostname) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName)
                .whereEqualTo("hostname", hostname).get().get()
                .getDocuments().stream().findFirst().orElse(null);
        if (doc == null || !doc.exists()) {
            return null;
        }
        return documentToComputadora(doc);
    }

    private static Map<String, Object> toMap(ImpresoraFirestore imp) {
        Map<String, Object> m = new HashMap<>();
        if (imp.getNombre() != null) m.put("nombre", imp.getNombre());
        if (imp.getDriver() != null) m.put("driver", imp.getDriver());
        if (imp.getPuerto() != null) m.put("puerto", imp.getPuerto());
        if (imp.getTipo() != null) m.put("tipo", imp.getTipo());
        if (imp.getTipoImpresora() != null) m.put("tipo_impresora", imp.getTipoImpresora());
        if (imp.getEstado() != null) m.put("estado", imp.getEstado());
        if (imp.getCompartida() != null) m.put("compartida", imp.getCompartida());
        if (imp.getPredeterminada() != null) m.put("predeterminada", imp.getPredeterminada());
        return m;
    }

    private static Map<String, Object> toMap(MonitorFirestore mon) {
        Map<String, Object> m = new HashMap<>();
        if (mon.getNombre() != null) m.put("nombre", mon.getNombre());
        if (mon.getResolucion() != null) m.put("resolucion", mon.getResolucion());
        if (mon.getPulgadas() != null) m.put("pulgadas", mon.getPulgadas());
        if (mon.getAnchoCm() != null) m.put("ancho_cm", mon.getAnchoCm());
        if (mon.getAltoCm() != null) m.put("alto_cm", mon.getAltoCm());
        return m;
    }

    private static Map<String, Object> toMap(DispositivoUsbFirestore usb) {
        Map<String, Object> m = new HashMap<>();
        if (usb.getNombre() != null) m.put("nombre", usb.getNombre());
        if (usb.getFabricante() != null) m.put("fabricante", usb.getFabricante());
        if (usb.getCategoria() != null) m.put("categoria", usb.getCategoria());
        if (usb.getClase() != null) m.put("clase", usb.getClase());
        if (usb.getConexion() != null) m.put("conexion", usb.getConexion());
        if (usb.getVid() != null) m.put("vid", usb.getVid());
        if (usb.getPid() != null) m.put("pid", usb.getPid());
        return m;
    }

    private static Map<String, Object> toMap(DispositivoAudioFirestore audio) {
        Map<String, Object> m = new HashMap<>();
        if (audio.getNombre() != null) m.put("nombre", audio.getNombre());
        if (audio.getFabricante() != null) m.put("fabricante", audio.getFabricante());
        if (audio.getEstado() != null) m.put("estado", audio.getEstado());
        return m;
    }

    private Computadora documentToComputadora(DocumentSnapshot doc) {
        Computadora c;
        try {
            c = doc.toObject(Computadora.class);
        } catch (RuntimeException ex) {
            c = new Computadora();
        }
        if (c == null) {
            c = new Computadora();
        }
        if (c.getUuid() == null || c.getUuid().isBlank()) {
            c.setUuid(doc.getId());
        }
        enriquecerCamposBasicosDesdeDoc(c, doc);
        c.setUbicacion(Ubicacion.normalizar(c.getUbicacion()));
        Map<String, Object> data = doc.getData();
        if (data == null) {
            return c;
        }

        // Extraer usuarioActual del mapa anidado "usuarios"
        Object usuariosObj = data.get("usuarios");
        if (usuariosObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> usuarios = (Map<String, Object>) usuariosObj;
            c.setUsuarioActual((String) usuarios.get("usuario_actual"));
        }

        if (c.getAnydeskId() == null || c.getAnydeskId().isBlank()) {
            String anydesk = AnydeskIdResolver.resolver(data);
            if (anydesk != null) {
                c.setAnydeskId(anydesk);
            }
        }

        // Campos del agente: parseo manual desde el mapa crudo (tipos Firestore Long/int mixtos).
        List<Ram> modulosRam = FirestoreComputadoraParser.parseModulosRam(data.get("modulos_ram"));
        if (!modulosRam.isEmpty()) {
            c.setModulos(modulosRam);
        }
        RamPlaca ramPlaca = FirestoreComputadoraParser.parseRamPlaca(data.get("ram_placa"));
        if (ramPlaca != null) {
            c.setRamPlaca(ramPlaca);
        }
        ProcesadorDetallado procesadorDetallado =
                FirestoreComputadoraParser.parseProcesadorDetallado(data.get("procesador_detallado"));
        if (procesadorDetallado != null) {
            c.setProcesadorDetallado(procesadorDetallado);
        }
        if (c.getProcesadorRaw() == null || c.getProcesadorRaw().isBlank()) {
            Object proc = data.get("procesador");
            if (proc != null) {
                c.setProcesadorRaw(String.valueOf(proc));
            }
        }
        Double ramTotal = FirestoreComputadoraParser.toDouble(data.get("ram_total_gb"));
        if (ramTotal != null) {
            c.setRamTotalGb(ramTotal);
        }
        Double cpuUso = FirestoreComputadoraParser.toDouble(data.get("cpu_uso_porcentaje"));
        if (cpuUso != null) {
            c.setCpuUsoPorcentaje(cpuUso);
        }
        Double ramUso = FirestoreComputadoraParser.toDouble(data.get("ram_uso_porcentaje"));
        if (ramUso != null) {
            c.setRamUsoPorcentaje(ramUso);
        }

        if (c.getPerifericos() == null) {
            PerifericosFirestore perifericos = doc.get("perifericos", PerifericosFirestore.class);
            if (perifericos != null) {
                c.setPerifericos(perifericos);
            }
        }

        return c;
    }

    /** Campos de listado que deben existir aunque {@code toObject} falle parcialmente. */
    private static void enriquecerCamposBasicosDesdeDoc(Computadora c, DocumentSnapshot doc) {
        if (c.getHostname() == null || c.getHostname().isBlank()) {
            c.setHostname(doc.getString("hostname"));
        }
        if (c.getSistemaOperativo() == null || c.getSistemaOperativo().isBlank()) {
            c.setSistemaOperativo(doc.getString("sistema_operativo"));
        }
        if (c.getArquitectura() == null || c.getArquitectura().isBlank()) {
            c.setArquitectura(doc.getString("arquitectura"));
        }
        if (c.getUbicacion() == null) {
            String ubicRaw = doc.getString("ubicacion");
            if (ubicRaw != null && !ubicRaw.isBlank()) {
                try {
                    c.setUbicacion(Ubicacion.normalizar(Ubicacion.valueOf(ubicRaw.trim())));
                } catch (IllegalArgumentException ignored) {
                    // valor legacy no enum; se deja null
                }
            }
        }
        if (c.getEstadoConexion() == null || c.getEstadoConexion().isBlank()) {
            c.setEstadoConexion(doc.getString("estado_conexion"));
        }
        if (c.getResponsableInventario() == null || c.getResponsableInventario().isBlank()) {
            c.setResponsableInventario(doc.getString("responsable_inventario"));
        }
        if (c.getCondicion() == null || c.getCondicion().isBlank()) {
            c.setCondicion(doc.getString("condicion"));
        }
        if (c.getDescripcionStock() == null || c.getDescripcionStock().isBlank()) {
            c.setDescripcionStock(doc.getString("descripcion_stock"));
        }
        if (c.getEspecificacionEsperada() == null) {
            c.setEspecificacionEsperada(
                    com.bacarsa.inventario.mapper.EspecificacionStockMapper.fromFirestoreMap(
                            doc.get("especificacion_esperada")));
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void cambiarEstado(String uuid, Estado nuevoEstado, String motivo,
                              String ubicacionStock, String responsableInventario)
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Documento no encontrado: " + uuid);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
            if (historial == null) {
                historial = new ArrayList<>();
            } else {
                historial = new ArrayList<>(historial);
            }

            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada.get("fechaHoraFin") == null) {
                    Map<String, Object> copia = new HashMap<>(entrada);
                    copia.put("fechaHoraFin", ahora);
                    historial.set(i, copia);
                }
            }

            Map<String, Object> estadoMap = new HashMap<>();
            estadoMap.put("nombre", nuevoEstado.getNombre());
            estadoMap.put("descripcion", nuevoEstado.getDescripcion());

            Map<String, Object> nuevaEntrada = new HashMap<>();
            nuevaEntrada.put("estado", estadoMap);
            nuevaEntrada.put("motivo", motivo);
            nuevaEntrada.put("fechaHoraInicio", ahora);
            nuevaEntrada.put("fechaHoraFin", null);
            if (ubicacionStock != null) {
                nuevaEntrada.put("ubicacion_stock", ubicacionStock);
            }
            if (responsableInventario != null && !responsableInventario.isEmpty()) {
                nuevaEntrada.put("responsable_inventario", responsableInventario);
            }

            historial.add(nuevaEntrada);

            Map<String, Object> updates = new HashMap<>();
            updates.put("historialEstados", historial);
            updates.put("estadoActual", estadoMap);
            if (responsableInventario != null) {
                updates.put("responsable_inventario",
                        responsableInventario.isEmpty() ? null : responsableInventario);
            }

            if ("Sin Asignar".equals(nuevoEstado.getNombre()) && ubicacionStock != null) {
                updates.put("ubicacion_stock", ubicacionStock);
            } else {
                updates.put("ubicacion_stock", FieldValue.delete());
            }

            transaction.update(docRef, updates);

            return null;
        }).get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void ingresarStock(String uuid, com.bacarsa.inventario.dto.IngresarStockDTO dto,
                              Ubicacion ubicacion, String motivo)
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Documento no encontrado: " + uuid);
            }

            Map<String, Object> updates = new HashMap<>();
            updates.putAll(buildStockFieldUpdates(doc, dto.getSistemaOperativo(),
                    dto.getTipoEquipo(), dto.getCondicion(), ubicacion, dto.getUbicacionStock(),
                    dto.getEspecificacionEsperada(), dto.getDescripcionStock(), null));

            // --- estado SIN_ASIGNAR + historial (replica lógica de cambiarEstado) ---
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
            if (historial == null) {
                historial = new ArrayList<>();
            } else {
                historial = new ArrayList<>(historial);
            }

            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada.get("fechaHoraFin") == null) {
                    Map<String, Object> copia = new HashMap<>(entrada);
                    copia.put("fechaHoraFin", ahora);
                    historial.set(i, copia);
                }
            }

            Map<String, Object> estadoMap = new HashMap<>();
            estadoMap.put("nombre", "Sin Asignar");
            estadoMap.put("descripcion", "Equipo en inventario sin usuario/responsable asignado");

            Map<String, Object> nuevaEntrada = new HashMap<>();
            nuevaEntrada.put("estado", estadoMap);
            nuevaEntrada.put("motivo", motivo != null ? motivo : "Ingreso a stock");
            nuevaEntrada.put("fechaHoraInicio", ahora);
            nuevaEntrada.put("fechaHoraFin", null);
            String ubicacionStock = dto.getUbicacionStock();
            if (ubicacionStock != null && !ubicacionStock.isBlank()) {
                nuevaEntrada.put("ubicacion_stock", ubicacionStock);
            }
            historial.add(nuevaEntrada);

            updates.put("historialEstados", historial);
            updates.put("estadoActual", estadoMap);
            updates.put("responsable_inventario", null);

            if (ubicacionStock != null && !ubicacionStock.isBlank()) {
                updates.put("ubicacion_stock", ubicacionStock);
            }

            transaction.update(docRef, updates);
            return null;
        }).get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void actualizarResponsableInventario(String uuid, String nuevoRI) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);
        docRef.update("responsable_inventario", nuevoRI).get();
    }

    /**
     * Escribe { comando } con merge en la colección {@code tareas}, documento id = uuid.
     * Equivale al setDoc({ merge: true }) que antes hacía el front con el SDK cliente.
     */
    public void enviarComando(String uuid, String comando) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(tareasCollection).document(uuid);
        Map<String, Object> data = new HashMap<>();
        data.put("comando", comando);
        ref.set(data, com.google.cloud.firestore.SetOptions.merge()).get();
    }

    /**
     * Envía el mismo comando a múltiples PCs en lotes de hasta 500 (límite Firestore).
     * @return cantidad de documentos escritos
     */
    public int enviarComandoMasivo(List<String> uuids, String comando) throws ExecutionException, InterruptedException {
        final int LOTE = 500;
        Map<String, Object> data = new HashMap<>();
        data.put("comando", comando);
        int total = 0;
        for (int i = 0; i < uuids.size(); i += LOTE) {
            List<String> chunk = uuids.subList(i, Math.min(i + LOTE, uuids.size()));
            WriteBatch batch = firestore.batch();
            for (String id : chunk) {
                DocumentReference ref = firestore.collection(tareasCollection).document(id);
                batch.set(ref, data, com.google.cloud.firestore.SetOptions.merge());
            }
            batch.commit().get();
            total += chunk.size();
        }
        return total;
    }

    /** Sin caché — uso interno del job de matching. */
    public List<Computadora> findAllSinCache() throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> documents = firestore.collection(collectionName).get().get().getDocuments();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(documentToComputadora(doc));
        }
        return result;
    }

    public List<Computadora> findCandidatosStockBaselineListo(int ventanaDias)
            throws ExecutionException, InterruptedException {
        Instant limite = Instant.now().minus(ventanaDias, ChronoUnit.DAYS);
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("origen_alta", OrigenAlta.STOCK.name())
                .whereEqualTo("estado_conciliacion", EstadoConciliacion.BASELINE_LISTO.name())
                .get().get();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            Computadora c = documentToComputadora(doc);
            if (c.getBaselineEsperado() == null || c.getBaselineEsperado().getArmadoAt() == null) {
                continue;
            }
            if (c.getBaselineEsperado().getArmadoAt().toDate().toInstant().isBefore(limite)) {
                continue;
            }
            result.add(c);
        }
        return result;
    }

    public List<ComputadoraListadoDTO> findStockSinAgente(int ventanaDias)
            throws ExecutionException, InterruptedException {
        Instant limite = Instant.now().minus(ventanaDias, ChronoUnit.DAYS);
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("origen_alta", OrigenAlta.STOCK.name())
                .whereEqualTo("estado_conciliacion", EstadoConciliacion.BASELINE_LISTO.name())
                .get().get();
        List<ComputadoraListadoDTO> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            if (doc.getTimestamp("ultima_sincronizacion") != null) {
                continue;
            }
            Timestamp armadoAt = doc.get("baseline_esperado.armado_at", Timestamp.class);
            if (armadoAt != null && armadoAt.toDate().toInstant().isBefore(limite)) {
                continue;
            }
            ComputadoraListadoDTO dto = ComputadoraListadoMapper.fromSnapshot(doc);
            if (dto != null) {
                result.add(dto);
            }
        }
        return result;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void updateMatchingFields(String uuid, Map<String, Object> updates)
            throws ExecutionException, InterruptedException {
        if (updates == null || updates.isEmpty()) {
            return;
        }
        firestore.collection(collectionName).document(uuid).update(updates).get();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void mergeUpdates(String uuid, Map<String, Object> updates)
            throws ExecutionException, InterruptedException {
        if (updates == null || updates.isEmpty()) {
            return;
        }
        firestore.collection(collectionName).document(uuid)
                .set(updates, com.google.cloud.firestore.SetOptions.merge()).get();
    }

    public DocumentSnapshot getDocumentSnapshot(String uuid) throws ExecutionException, InterruptedException {
        return firestore.collection(collectionName).document(uuid).get().get();
    }

    public List<Computadora> findMatchingErrors() throws ExecutionException, InterruptedException {
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("matching_job_estado", MatchingJobEstado.MATCHING_ERROR.name())
                .limit(100)
                .get().get();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            result.add(documentToComputadora(doc));
        }
        return result;
    }

    public List<Computadora> findMatchingEnProcesoStale(long timeoutMinutes)
            throws ExecutionException, InterruptedException {
        Instant limite = Instant.now().minus(timeoutMinutes, ChronoUnit.MINUTES);
        Timestamp tsLimite = Timestamp.ofTimeSecondsAndNanos(limite.getEpochSecond(), 0);
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("matching_job_estado", MatchingJobEstado.MATCHING_EN_PROCESO.name())
                .limit(200)
                .get().get();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            Timestamp enProcesoAt = doc.getTimestamp("matching_en_proceso_at");
            if (enProcesoAt == null || enProcesoAt.compareTo(tsLimite) >= 0) {
                continue;
            }
            result.add(documentToComputadora(doc));
            if (result.size() >= 50) {
                break;
            }
        }
        return result;
    }
}
