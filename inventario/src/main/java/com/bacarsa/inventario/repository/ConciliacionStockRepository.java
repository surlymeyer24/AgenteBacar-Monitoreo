package com.bacarsa.inventario.repository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.ConciliacionStock;
import com.bacarsa.inventario.models.DecisionConciliacion;
import com.bacarsa.inventario.models.OrigenConciliacion;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class ConciliacionStockRepository {

    private final Firestore firestore;
    private final String collectionName;

    public ConciliacionStockRepository(Firestore firestore,
            @Value("${firebase.collection.conciliaciones_stock:conciliaciones_stock}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public String save(ConciliacionStock conciliacion) throws ExecutionException, InterruptedException {
        CollectionReference col = firestore.collection(collectionName);
        DocumentReference ref = conciliacion.getId() != null && !conciliacion.getId().isBlank()
                ? col.document(conciliacion.getId())
                : col.document();
        if (conciliacion.getFecha() == null) {
            conciliacion.setFecha(Timestamp.now());
        }
        ref.set(conciliacion).get();
        conciliacion.setId(ref.getId());
        return ref.getId();
    }

    public ConciliacionStock findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return documentToModel(doc);
    }

    public ConciliacionStock findByAgenteAndSnapshotClave(String agenteUuid, String snapshotClave)
            throws ExecutionException, InterruptedException {
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("agente_uuid", agenteUuid)
                .whereEqualTo("snapshot_clave", snapshotClave)
                .limit(5)
                .get().get();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            ConciliacionStock c = documentToModel(doc);
            if (c.getDecision() != DecisionConciliacion.RECHAZADA) {
                return c;
            }
        }
        return null;
    }

    public List<ConciliacionStock> findByDecision(DecisionConciliacion decision, int ventanaDias,
            int limit, int offset) throws ExecutionException, InterruptedException {
        List<ConciliacionStock> filtradas = listarPorDecisionYVentana(decision, ventanaDias);
        int from = Math.min(offset, filtradas.size());
        int to = Math.min(from + limit, filtradas.size());
        return filtradas.subList(from, to);
    }

    public long countByDecision(DecisionConciliacion decision, int ventanaDias)
            throws ExecutionException, InterruptedException {
        return listarPorDecisionYVentana(decision, ventanaDias).size();
    }

    /**
     * Consulta solo por {@code decision} (índice simple automático) y aplica ventana/orden en memoria.
     * Evita depender del índice compuesto decision+fecha mientras la colección es chica (Fase 2).
     */
    private List<ConciliacionStock> listarPorDecisionYVentana(DecisionConciliacion decision, int ventanaDias)
            throws ExecutionException, InterruptedException {
        Timestamp desde = Timestamp.ofTimeSecondsAndNanos(
                Instant.now().minus(ventanaDias, ChronoUnit.DAYS).getEpochSecond(), 0);
        QuerySnapshot snap = firestore.collection(collectionName)
                .whereEqualTo("decision", decision.name())
                .get()
                .get();
        return snap.getDocuments().stream()
                .map(this::documentToModel)
                .filter(c -> c.getFecha() != null && c.getFecha().compareTo(desde) >= 0)
                .sorted(Comparator.comparing(ConciliacionStock::getFecha, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public void updateDecision(String id, DecisionConciliacion decision, String usuario,
            Map<String, Object> extra) throws ExecutionException, InterruptedException {
        Map<String, Object> updates = new HashMap<>();
        updates.put("decision", decision.name());
        updates.put("usuario", usuario);
        updates.put("fecha", Timestamp.now());
        if (extra != null) {
            updates.putAll(extra);
        }
        firestore.collection(collectionName).document(id).update(updates).get();
    }

    private ConciliacionStock documentToModel(DocumentSnapshot doc) {
        ConciliacionStock c = doc.toObject(ConciliacionStock.class);
        if (c == null) {
            c = new ConciliacionStock();
        }
        c.setId(doc.getId());
        if (c.getDecision() == null) {
            String raw = doc.getString("decision");
            if (raw != null) {
                c.setDecision(DecisionConciliacion.valueOf(raw));
            }
        }
        if (c.getOrigen() == null) {
            String raw = doc.getString("origen");
            if (raw != null) {
                c.setOrigen(OrigenConciliacion.valueOf(raw));
            }
        }
        return c;
    }
}
