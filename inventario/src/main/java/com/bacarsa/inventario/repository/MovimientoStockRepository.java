package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.MovimientoStock;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;

@Repository
public class MovimientoStockRepository {

    private final Firestore firestore;
    private final String collectionName;

    public MovimientoStockRepository(Firestore firestore,
            @Value("${firebase.collection.movimientos_stock:movimientos_stock}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("movimientosStock")
    public List<MovimientoStock> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<MovimientoStock> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToMovimiento(doc));
        }
        return result;
    }

    @CacheEvict(value = "movimientosStock", allEntries = true)
    public void save(MovimientoStock movimiento) throws ExecutionException, InterruptedException {
        if (movimiento.getId() == null || movimiento.getId().isBlank()) {
            DocumentReference ref = firestore.collection(collectionName).document();
            movimiento.setId(ref.getId());
            ref.set(movimiento).get();
        } else {
            firestore.collection(collectionName).document(movimiento.getId()).set(movimiento).get();
        }
    }

    @CacheEvict(value = "movimientosStock", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).set(campos, SetOptions.merge()).get();
    }

    private static MovimientoStock snapshotToMovimiento(DocumentSnapshot doc) {
        MovimientoStock m = doc.toObject(MovimientoStock.class);
        if (m == null) {
            m = new MovimientoStock();
        }
        m.setId(doc.getId());
        return m;
    }
}
