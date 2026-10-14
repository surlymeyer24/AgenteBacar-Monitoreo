package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.mapper.EspecificacionStockMapper;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.PerifericoManual;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class PerifericoManualRepository {

    private final Firestore firestore;
    private final String collectionName;

    public PerifericoManualRepository(Firestore firestore,
            @Value("${firebase.collection.perifericos_manuales}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("perifericosManuales")
    public List<PerifericoManual> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<PerifericoManual> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToPeriferico(doc));
        }
        return result;
    }

    @Cacheable(value = "perifericosManuales", key = "#id")
    public PerifericoManual findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToPeriferico(doc);
    }

    @Deprecated
    @Cacheable(value = "perifericosManuales", key = "'hostname:' + #hostname.toLowerCase()")
    public List<PerifericoManual> findByComputadoraHostname(String hostname)
            throws ExecutionException, InterruptedException {
        List<PerifericoManual> result = new ArrayList<>();
        ApiFuture<QuerySnapshot> futureNew = firestore.collection(collectionName)
                .whereEqualTo("computadora_hostname", hostname)
                .get();
        for (QueryDocumentSnapshot doc : futureNew.get().getDocuments()) {
            result.add(snapshotToPeriferico(doc));
        }
        if (result.isEmpty()) {
            ApiFuture<QuerySnapshot> futureLegacy = firestore.collection(collectionName)
                    .whereEqualTo("computadoraHostname", hostname)
                    .get();
            for (QueryDocumentSnapshot doc : futureLegacy.get().getDocuments()) {
                result.add(snapshotToPeriferico(doc));
            }
        }
        return result;
    }

    @Cacheable(value = "perifericosManuales", key = "'uuid:' + #computadoraUuid")
    public List<PerifericoManual> findByComputadoraUuid(String computadoraUuid)
            throws ExecutionException, InterruptedException {
        if (computadoraUuid == null || computadoraUuid.isBlank()) {
            return List.of();
        }
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("computadora_uuid", computadoraUuid.trim())
                .get();
        List<PerifericoManual> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            result.add(snapshotToPeriferico(doc));
        }
        return result;
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public String create(PerifericoManual periferico) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(periferico).get();
        return ref.getId();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void actualizar(String id, java.util.Map<String, Object> campos)
            throws ExecutionException, InterruptedException {
        if (campos.isEmpty()) return;
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void eliminar(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void decrementarCantidad(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id)
                .update("cantidad", FieldValue.increment(-1)).get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void updateAsignacionPc(String id, String computadoraUuid, String hostname)
            throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("computadora_uuid", computadoraUuid);
        updates.put("computadora_hostname", hostname);
        firestore.collection(collectionName).document(id).update(updates).get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void limpiarAsignacion(String id, String ubicacionDeposito)
            throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("computadora_uuid", FieldValue.delete());
        updates.put("computadora_hostname", FieldValue.delete());
        updates.put("computadoraHostname", FieldValue.delete());
        updates.put("ubicacion", ubicacionDeposito);
        firestore.collection(collectionName).document(id).update(updates).get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void updateUbicacion(String id, String ubicacion)
            throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id)
                .update("ubicacion", ubicacion).get();
    }

    @CacheEvict(value = "perifericosManuales", allEntries = true)
    public void cambiarEstado(String id, Estado nuevoEstado, String motivo)
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        String motivoGuardado = motivo != null ? motivo : "";

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Periférico no encontrado: " + id);
            }

            List<Map<String, Object>> historial = copiarHistorialMutableDesdeSnapshot(doc);

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

    private static PerifericoManual snapshotToPeriferico(DocumentSnapshot doc) {
        PerifericoManual p = doc.toObject(PerifericoManual.class);
        if (p == null) {
            p = new PerifericoManual();
        }
        p.setId(doc.getId());
        if (p.getComputadoraHostname() == null) {
            String legacy = doc.getString("computadoraHostname");
            if (legacy != null && !legacy.isBlank()) {
                p.setComputadoraHostname(legacy);
            }
        }
        EspecificacionStock spec = EspecificacionStockMapper.fromFirestoreMap(doc.get("especificacion_stock"));
        spec = EspecificacionStockMapper.enrichFromNombre(spec, doc.getString("nombre"));
        p.setEspecificacionStock(spec);
        return p;
    }

    private static List<Map<String, Object>> copiarHistorialMutableDesdeSnapshot(DocumentSnapshot doc) {
        Object raw = doc.get("historialEstados");
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
}
