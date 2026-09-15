package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.SesionBloqueo;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class SesionBloqueoRepository {

    private final Firestore firestore;
    private final String collectionName;

    public SesionBloqueoRepository(Firestore firestore,
            @Value("${firebase.collection.sesion_bloqueos}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public void registrar(String computadoraId, String hostname, String ubicacion,
            String estadoAnterior, Integer sesionBloqueoAutoMin)
            throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("computadora_id", computadoraId);
        data.put("hostname", hostname);
        data.put("ubicacion", ubicacion);
        data.put("bloqueado_en", Timestamp.now());
        data.put("estado_anterior", estadoAnterior);
        if (sesionBloqueoAutoMin != null) {
            data.put("sesion_bloqueo_auto_min", sesionBloqueoAutoMin);
        }
        firestore.collection(collectionName).document().set(data).get();
    }

    public List<SesionBloqueo> listarRecientes(int limite) throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName)
                .orderBy("bloqueado_en", Query.Direction.DESCENDING)
                .limit(limite);
        ApiFuture<QuerySnapshot> future = query.get();
        List<SesionBloqueo> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            result.add(snapshotToEntity(doc));
        }
        return result;
    }

    private SesionBloqueo snapshotToEntity(DocumentSnapshot doc) {
        SesionBloqueo b = doc.toObject(SesionBloqueo.class);
        if (b == null) {
            b = new SesionBloqueo();
        }
        b.setId(doc.getId());
        return b;
    }
}
