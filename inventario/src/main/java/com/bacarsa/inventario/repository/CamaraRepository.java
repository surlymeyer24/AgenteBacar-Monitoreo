package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.function.BiFunction;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.historial.HistorialLectura;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Estado;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;

@Repository
public class CamaraRepository {

    private final Firestore firestore;
    private final String collectionName;

    public CamaraRepository(Firestore firestore,
                            @Value("${firebase.collection.camaras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable(value = "camaras")
    public List<Camara> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    @Cacheable(value = "camaras", key = "'ubicacion:' + #ubicacion")
    public List<Camara> findByUbicacion(String ubicacion) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("ubicacion", ubicacion)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    @Cacheable(value = "camaras", key = "#id")
    public Camara findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToCamara(doc);
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public String create(Camara camara) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(camara).get();
        return ref.getId();
    }

    /** Persiste con ID fijo (p. ej. importación masiva); sobrescribe el documento si ya existe. */
    @CacheEvict(value = "camaras", allEntries = true)
    public void guardarConId(String id, Camara camara) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        camara.setId(null);
        ref.set(camara).get();
    }

    private static Camara snapshotToCamara(DocumentSnapshot doc) {
        Camara c = doc.toObject(Camara.class);
        if (c == null) {
            c = new Camara();
        }
        c.setId(doc.getId());
        c.setHistorial(HistorialLectura.desdeDocumento(doc.get("historial")));
        return c;
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void updateUbicacion(String id, String ubicacion) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        ref.update("ubicacion", ubicacion).get();
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        docRef.update(campos).get();
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void actualizar(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).set(campos, SetOptions.merge()).get();
    }

    /**
     * Cierra el tramo del estado anterior en {@code historialEstados} y agrega el nuevo estado.
     */
    @CacheEvict(value = "camaras", allEntries = true)
    public void cambiarEstado(String id, Estado nuevoEstado, String motivo) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        String motivoGuardado = (motivo == null || motivo.isBlank()) ? "Cambio de estado" : motivo.trim();

        firestore.runTransaction(transaction -> {
            DocumentSnapshot snapshot = transaction.get(docRef).get();

            List<Map<String, Object>> historial = copiarHistorialMutableDesdeSnapshot(snapshot);
            Timestamp ahora = Timestamp.now();

            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada == null) continue;
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
            nuevaEntrada.put("motivo", motivoGuardado);
            nuevaEntrada.put("fechaHoraInicio", ahora);
            nuevaEntrada.put("fechaHoraFin", null);

            historial.add(nuevaEntrada);

            transaction.update(docRef,
                    "historialEstados", historial,
                    "estadoActual", estadoMap);

            return null;
        }).get();
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void aplicarHistorial(String id, BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> plan)
            throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot doc = transaction.get(ref).get();
                Map<String, Object> data = doc.exists() ? doc.getData() : null;
                EscrituraHistorial escritura = plan.apply(data, Timestamp.now());
                if (escritura.modo() == EscrituraHistorial.Modo.NADA) {
                    return null;
                }
                Map<String, Object> campos = conBorrados(escritura.campos());
                if (!doc.exists()) {
                    if (escritura.modo() != EscrituraHistorial.Modo.CREAR_CON_HISTORIAL) {
                        throw new IllegalArgumentException("Cámara no encontrada: " + id);
                    }
                    transaction.set(ref, campos);
                } else {
                    transaction.update(ref, campos);
                }
                return null;
            }).get();
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof RuntimeException re) throw re;
            throw ex;
        }
    }

    private static Map<String, Object> conBorrados(Map<String, Object> campos) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : campos.entrySet()) {
            out.put(entry.getKey(), entry.getValue() == null ? FieldValue.delete() : entry.getValue());
        }
        return out;
    }

    private static List<Map<String, Object>> copiarHistorialMutableDesdeSnapshot(DocumentSnapshot doc) {
        Object raw = doc.get("historialEstados");
        List<Map<String, Object>> historial = new ArrayList<>();
        if (!(raw instanceof List<?> lista)) {
            return historial;
        }
        for (Object item : lista) {
            if (!(item instanceof Map<?, ?> m)) {
                continue;
            }
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

    @Cacheable(value = "camaras", key = "'nvrId:' + #nvrId")
    public List<Camara> findByNvrId(String nvrId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("nvrId", nvrId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void updateNvrId(String id, String nvrId) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        ref.update("nvrId", nvrId).get();
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    @CacheEvict(value = "camaras", allEntries = true)
    public void mergeCodigoInterno(String id, String codigo) throws ExecutionException, InterruptedException {
        if (id == null || id.isBlank() || codigo == null || codigo.isBlank()) {
            return;
        }
        firestore.collection(collectionName).document(id)
                .set(MergeCodigoInterno.unSoloCampo(codigo), SetOptions.merge()).get();
    }

    @Cacheable(value = "camaras", key = "'conteoNvr'")
    public Map<String, Long> contarCamarasPorNvrId() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        Map<String, Long> out = new HashMap<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            String nvrId = doc.getString("nvrId");
            if (nvrId == null || nvrId.isBlank()) {
                continue;
            }
            out.merge(nvrId.trim(), 1L, Long::sum);
        }
        return out;
    }

    @Cacheable(value = "camaras", key = "'conteoNvr:' + #nvrId")
    public int contarPorNvrId(String nvrId) throws ExecutionException, InterruptedException {
        if (nvrId == null || nvrId.isBlank()) {
            return 0;
        }
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("nvrId", nvrId.trim())
                .get();
        return future.get().getDocuments().size();
    }
}
