package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.AccessPoint;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

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
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    @CacheEvict(value = "accessPoints", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    private static AccessPoint snapshotToAp(DocumentSnapshot doc) {
        AccessPoint ap = doc.toObject(AccessPoint.class);
        if (ap == null) {
            ap = new AccessPoint();
        }
        ap.setId(doc.getId());
        return ap;
    }
}
