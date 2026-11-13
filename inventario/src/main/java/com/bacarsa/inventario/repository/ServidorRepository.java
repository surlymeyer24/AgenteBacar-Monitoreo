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
import com.bacarsa.inventario.models.Servidor;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class ServidorRepository {

    private final Firestore firestore;
    private final String collectionName;

    public ServidorRepository(Firestore firestore,
            @Value("${firebase.collection.servidores}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("servidores")
    public List<Servidor> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Servidor> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToServidor(doc));
        }
        return result;
    }

    @Cacheable(value = "servidores", key = "#id")
    public Servidor findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) return null;
        return snapshotToServidor(doc);
    }

    @CacheEvict(value = "servidores", allEntries = true)
    public String create(Servidor servidor) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(servidor).get();
        return ref.getId();
    }

    @CacheEvict(value = "servidores", allEntries = true)
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
                        throw new IllegalArgumentException("Servidor no encontrado: " + id);
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

    @CacheEvict(value = "servidores", allEntries = true)
    public void update(String id, Map<String, Object> fields) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(fields).get();
    }

    @CacheEvict(value = "servidores", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    private static Servidor snapshotToServidor(DocumentSnapshot doc) {
        Servidor s = doc.toObject(Servidor.class);
        if (s == null) s = new Servidor();
        s.setId(doc.getId());
        s.setHistorial(HistorialLectura.desdeDocumento(doc.getData()));
        return s;
    }
}
