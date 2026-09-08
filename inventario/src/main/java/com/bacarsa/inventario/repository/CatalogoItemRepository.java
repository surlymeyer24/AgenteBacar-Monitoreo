package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.CatalogoItem;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;

@Repository
public class CatalogoItemRepository {

    private final Firestore firestore;
    private final String collectionName;

    public CatalogoItemRepository(Firestore firestore,
            @Value("${firebase.collection.catalogo_items}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable(value = "catalogoItems", key = "'all:' + #catalogo")
    public List<CatalogoItem> findByCatalogo(String catalogo) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection(collectionName)
                .whereEqualTo("catalogo", catalogo)
                .get().get().getDocuments();
        List<CatalogoItem> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            result.add(snapshotToItem(doc));
        }
        result.sort(java.util.Comparator.comparingInt(CatalogoItem::getOrden)
                .thenComparing(CatalogoItem::getLabel, String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    @Cacheable(value = "catalogoItems", key = "'activos:' + #catalogo")
    public List<CatalogoItem> findByCatalogoActivos(String catalogo) throws ExecutionException, InterruptedException {
        List<CatalogoItem> todos = findByCatalogo(catalogo);
        List<CatalogoItem> activos = new ArrayList<>();
        for (CatalogoItem item : todos) {
            if (item.isActivo()) {
                activos.add(item);
            }
        }
        return activos;
    }

    public Optional<CatalogoItem> findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return Optional.empty();
        }
        return Optional.of(snapshotToItem(doc));
    }

    @CacheEvict(value = "catalogoItems", allEntries = true)
    public void save(CatalogoItem item) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("catalogo", item.getCatalogo());
        data.put("codigo", item.getCodigo());
        data.put("label", item.getLabel());
        data.put("activo", item.isActivo());
        data.put("orden", item.getOrden());
        data.put("icono", item.getIcono());
        firestore.collection(collectionName).document(item.getId()).set(data).get();
    }

    @CacheEvict(value = "catalogoItems", allEntries = true)
    public void actualizar(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(campos).get();
    }

    public boolean existenItemsParaCatalogo(String catalogo) throws ExecutionException, InterruptedException {
        return !firestore.collection(collectionName)
                .whereEqualTo("catalogo", catalogo)
                .limit(1)
                .get().get().isEmpty();
    }

    private static CatalogoItem snapshotToItem(DocumentSnapshot doc) {
        CatalogoItem item = new CatalogoItem();
        item.setId(doc.getId());
        item.setCatalogo(doc.getString("catalogo"));
        item.setCodigo(doc.getString("codigo"));
        item.setLabel(doc.getString("label"));
        Boolean activo = doc.getBoolean("activo");
        item.setActivo(Boolean.TRUE.equals(activo));
        Long orden = doc.getLong("orden");
        item.setOrden(orden != null ? orden.intValue() : 0);
        item.setIcono(doc.getString("icono"));
        return item;
    }
}
