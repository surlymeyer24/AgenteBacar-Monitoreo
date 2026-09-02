package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Televisor;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class TelevisorRepository {

    private final Firestore firestore;
    private final String collectionName;

    public TelevisorRepository(Firestore firestore,
            @Value("${firebase.collection.televisores}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("televisores")
    public List<Televisor> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Televisor> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToTelevisor(doc));
        }
        return result;
    }

    @Cacheable(value = "televisores", key = "#id")
    public Televisor findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToTelevisor(doc);
    }

    @CacheEvict(value = "televisores", allEntries = true)
    public String create(Televisor tv) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(tv).get();
        return ref.getId();
    }

    @CacheEvict(value = "televisores", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    @CacheEvict(value = "televisores", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    private static Televisor snapshotToTelevisor(DocumentSnapshot doc) {
        Televisor tv = doc.toObject(Televisor.class);
        if (tv == null) {
            tv = new Televisor();
        }
        tv.setId(doc.getId());
        return tv;
    }
}
