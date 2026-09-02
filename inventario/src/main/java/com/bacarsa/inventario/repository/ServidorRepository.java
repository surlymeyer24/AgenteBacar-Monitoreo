package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Servidor;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
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
        return s;
    }
}
