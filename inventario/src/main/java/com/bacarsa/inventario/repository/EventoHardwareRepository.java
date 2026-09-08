package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.EventoHardware;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class EventoHardwareRepository {

    private final Firestore firestore;
    private final String collectionName;

    public EventoHardwareRepository(Firestore firestore,
            @Value("${firebase.collection.eventos_hardware}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("eventosHardware")
    public List<EventoHardware> findAll() throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName)
                .orderBy("timestamp", Query.Direction.DESCENDING);
        return executeQuery(query);
    }

    public List<EventoHardware> findFiltered(String estado, String uuid, Boolean leido)
            throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName);

        if (estado != null && !estado.isBlank()) {
            query = query.whereEqualTo("estado_seguimiento", estado);
        }
        if (uuid != null && !uuid.isBlank()) {
            query = query.whereEqualTo("uuid", uuid);
        }
        if (leido != null) {
            query = query.whereEqualTo("leido", leido);
        }

        // Orden en memoria: evita índices compuestos en Firestore (estado + timestamp, etc.).
        List<EventoHardware> result = executeQuery(query);
        result.sort(EventoHardwareRepository::compareByTimestampDesc);
        return result;
    }

    @Cacheable(value = "eventosHardware", key = "#id")
    public EventoHardware findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) return null;
        return snapshotToEntity(doc);
    }

    public long countPendientesNoLeidos() throws ExecutionException, InterruptedException {
        Query query = firestore.collection(collectionName)
                .whereEqualTo("estado_seguimiento", "pendiente");
        ApiFuture<QuerySnapshot> future = query.get();
        return future.get().getDocuments().stream()
                .filter(doc -> {
                    Boolean leido = doc.getBoolean("leido");
                    return leido == null || !leido;
                })
                .count();
    }

    @CacheEvict(value = "eventosHardware", allEntries = true)
    public void update(String id, Map<String, Object> fields) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).update(fields).get();
    }

    private List<EventoHardware> executeQuery(Query query) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<EventoHardware> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToEntity(doc));
        }
        return result;
    }

    private static EventoHardware snapshotToEntity(DocumentSnapshot doc) {
        EventoHardware e = doc.toObject(EventoHardware.class);
        if (e == null) e = new EventoHardware();
        e.setId(doc.getId());
        return e;
    }

    private static int compareByTimestampDesc(EventoHardware a, EventoHardware b) {
        long ta = a.getTimestamp() != null ? a.getTimestamp().toDate().getTime() : 0L;
        long tb = b.getTimestamp() != null ? b.getTimestamp().toDate().getTime() : 0L;
        return Long.compare(tb, ta);
    }
}
