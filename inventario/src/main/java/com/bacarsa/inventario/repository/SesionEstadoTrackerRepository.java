package com.bacarsa.inventario.repository;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

@Repository
public class SesionEstadoTrackerRepository {

    private static final String DOC_ID = "cache";

    private final Firestore firestore;
    private final String collectionName;

    public SesionEstadoTrackerRepository(Firestore firestore,
            @Value("${firebase.collection.sesion_estado_tracker}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @SuppressWarnings("unchecked")
    public Map<String, String> loadEstados() throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(DOC_ID).get().get();
        if (!doc.exists()) {
            return new HashMap<>();
        }
        Map<String, Object> data = doc.getData();
        if (data == null) {
            return new HashMap<>();
        }
        Object raw = data.get("estados");
        if (!(raw instanceof Map<?, ?> rawMap)) {
            return new HashMap<>();
        }
        Map<String, String> estados = new HashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null) {
                estados.put(entry.getKey().toString(), entry.getValue().toString());
            }
        }
        return estados;
    }

    public void saveEstados(Map<String, String> estados) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("estados", estados);
        firestore.collection(collectionName).document(DOC_ID).set(data).get();
    }

    public void clearEstados() throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(DOC_ID).delete().get();
    }
}
