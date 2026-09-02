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

import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.MaquinaTesoreria;
import com.bacarsa.inventario.models.TipoMaquina;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class MaquinaTesoreriaRepository {

    private final Firestore firestore;
    private final String collectionName;

    public MaquinaTesoreriaRepository(Firestore firestore,
            @Value("${firebase.collection.maquinas_tesoreria}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("maquinasTesoreria")
    public List<MaquinaTesoreria> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<MaquinaTesoreria> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToMaquina(doc));
        }
        return result;
    }

    @Cacheable(value = "maquinasTesoreria", key = "'tipo:' + #tipo")
    public List<MaquinaTesoreria> findByTipo(TipoMaquina tipo) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("tipo", tipo.name())
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<MaquinaTesoreria> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToMaquina(doc));
        }
        return result;
    }

    @Cacheable(value = "maquinasTesoreria", key = "#id")
    public MaquinaTesoreria findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToMaquina(doc);
    }

    @CacheEvict(value = "maquinasTesoreria", allEntries = true)
    public String create(MaquinaTesoreria maquina) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(maquina).get();
        return ref.getId();
    }

    @CacheEvict(value = "maquinasTesoreria", allEntries = true)
    public void guardarConId(String id, MaquinaTesoreria maquina) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        maquina.setId(null);
        ref.set(maquina).get();
    }

    @CacheEvict(value = "maquinasTesoreria", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        docRef.update(campos).get();
    }

    @CacheEvict(value = "maquinasTesoreria", allEntries = true)
    public void cambiarEstado(String id, Estado nuevoEstado, String motivo)
            throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        String motivoGuardado = motivo != null ? motivo : "";

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Máquina no encontrada: " + id);
            }

            List<Map<String, Object>> historial = copiarHistorialMutableDesdeSnapshot(doc);

            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada == null) {
                    continue;
                }
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

    private static MaquinaTesoreria snapshotToMaquina(DocumentSnapshot doc) {
        MaquinaTesoreria m = doc.toObject(MaquinaTesoreria.class);
        if (m == null) {
            m = new MaquinaTesoreria();
        }
        m.setId(doc.getId());
        return m;
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
}
