package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.StockFicha;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;

@Repository
public class StockFichaRepository {

    private final Firestore firestore;
    private final String collectionName;

    public StockFichaRepository(Firestore firestore,
            @Value("${firebase.collection.stock_fichas:stock_fichas}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("stockFichas")
    public List<StockFicha> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<StockFicha> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            StockFicha item = doc.toObject(StockFicha.class);
            if (item != null) {
                if (item.getCodigoInterno() == null || item.getCodigoInterno().isBlank()) {
                    item.setCodigoInterno(doc.getId());
                }
                result.add(item);
            }
        }
        return result;
    }

    @Cacheable(value = "stockFichas", key = "#codigoInterno")
    public StockFicha findById(String codigoInterno) throws ExecutionException, InterruptedException {
        if (codigoInterno == null || codigoInterno.isBlank()) {
            return null;
        }
        DocumentSnapshot doc = firestore.collection(collectionName).document(codigoInterno.trim()).get().get();
        if (!doc.exists()) {
            return null;
        }
        StockFicha item = doc.toObject(StockFicha.class);
        if (item != null && (item.getCodigoInterno() == null || item.getCodigoInterno().isBlank())) {
            item.setCodigoInterno(doc.getId());
        }
        return item;
    }

    @CacheEvict(value = "stockFichas", allEntries = true)
    public void save(StockFicha ficha) throws ExecutionException, InterruptedException {
        if (ficha == null) {
            throw new IllegalArgumentException("La ficha de stock no puede ser nula");
        }
        String docId = ficha.getCodigoInterno();
        if (docId == null || docId.isBlank()) {
            throw new IllegalArgumentException("La ficha de stock debe poseer codigo_interno");
        }
        docId = docId.trim();
        ficha.setCodigoInterno(docId);
        DocumentReference ref = firestore.collection(collectionName).document(docId);
        ref.set(ficha, SetOptions.merge()).get();
    }

    @CacheEvict(value = "stockFichas", allEntries = true)
    public void update(String codigoInterno, Map<String, Object> updates) throws ExecutionException, InterruptedException {
        if (codigoInterno == null || codigoInterno.isBlank()) {
            throw new IllegalArgumentException("El codigo_interno no puede estar vacío");
        }
        firestore.collection(collectionName).document(codigoInterno.trim()).set(updates, SetOptions.merge()).get();
    }

    @CacheEvict(value = "stockFichas", allEntries = true)
    public void delete(String codigoInterno) throws ExecutionException, InterruptedException {
        if (codigoInterno == null || codigoInterno.isBlank()) {
            return;
        }
        firestore.collection(collectionName).document(codigoInterno.trim()).delete().get();
    }
}
