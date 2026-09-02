package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Celular;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class CelularRepository {

    private final Firestore firestore;
    private final String collectionName;

    public CelularRepository(Firestore firestore,
            @Value("${firebase.collection.celulares}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("celulares")
    public List<Celular> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Celular> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCelular(doc));
        }
        return result;
    }

    @Cacheable(value = "celulares", key = "#id")
    public Celular findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToCelular(doc);
    }

    @CacheEvict(value = "celulares", allEntries = true)
    public String create(Celular celular) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(celular).get();
        return ref.getId();
    }

    @CacheEvict(value = "celulares", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    @CacheEvict(value = "celulares", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    private static Celular snapshotToCelular(DocumentSnapshot doc) {
        Celular celular = doc.toObject(Celular.class);
        if (celular == null) {
            celular = new Celular();
        }
        celular.setId(doc.getId());
        return celular;
    }
}
