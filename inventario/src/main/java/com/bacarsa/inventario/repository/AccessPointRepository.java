package com.bacarsa.inventario.repository;

import java.util.ArrayList;
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
import com.bacarsa.inventario.models.AccessPoint;
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
public class AccessPointRepository {

    private final Firestore firestore;
    private final String collectionName;

    public AccessPointRepository(Firestore firestore,
            @Value("${firebase.collection.access_points}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("accessPoints")
    public List<AccessPoint> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<AccessPoint> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToAp(doc));
        }
        return result;
    }

    @Cacheable(value = "accessPoints", key = "#id")
    public AccessPoint findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToAp(doc);
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public String create(AccessPoint ap) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(ap).get();
        return ref.getId();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void guardarConId(String id, AccessPoint ap) throws ExecutionException, InterruptedException {
        ap.setId(id);
        firestore.collection(collectionName).document(id).set(ap).get();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
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
                        throw new IllegalArgumentException("Access Point no encontrado: " + id);
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

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void actualizar(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).set(campos, SetOptions.merge()).get();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void mergeCodigoInterno(String id, String codigo) throws ExecutionException, InterruptedException {
        if (id == null || id.isBlank() || codigo == null || codigo.isBlank()) {
            return;
        }
        firestore.collection(collectionName).document(id)
                .set(MergeCodigoInterno.unSoloCampo(codigo), SetOptions.merge()).get();
    }

    private static AccessPoint snapshotToAp(DocumentSnapshot doc) {
        AccessPoint ap = doc.toObject(AccessPoint.class);
        if (ap == null) {
            ap = new AccessPoint();
        }
        ap.setId(doc.getId());
        ap.setHistorial(HistorialLectura.desdeDocumento(doc.getData()));
        return ap;
    }
}
