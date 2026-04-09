package com.bacarsa.inventario.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Repository
public class ComputadoraRepository {

    private final Firestore firestore;
    private final String collectionName;

    public ComputadoraRepository(Firestore firestore,
                                  @Value("${firebase.collection.computadoras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public List<Map<String, Object>> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Map<String, Object> data = doc.getData();
            data.put("id", doc.getId());
            result.add(data);
        }
        return result;
    }

    public Map<String, Object> findByUuid(String uuid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(uuid).get().get();
        if (!doc.exists()) {
            return null;
        }
        Map<String, Object> data = doc.getData();
        data.put("id", doc.getId());
        return data;
    }

}
