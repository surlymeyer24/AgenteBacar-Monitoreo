package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.AsignacionResponsable;
import com.bacarsa.inventario.models.Responsable;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteBatch;

@Repository
public class ResponsableRepository {

    private static final String SUB_ASIGNACIONES = "asignaciones";

    private final Firestore firestore;
    private final String collectionName;

    public ResponsableRepository(Firestore firestore,
            @Value("${firebase.collection.responsables:responsables}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("responsables")
    public List<Responsable> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<Responsable> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            Responsable r = doc.toObject(Responsable.class);
            if (r != null) {
                r.setId(doc.getId());
                result.add(r);
            }
        }
        return result;
    }

    @Cacheable(value = "responsables", key = "#id")
    public Responsable findById(String id) throws ExecutionException, InterruptedException {
        if (id == null || id.isBlank()) {
            return null;
        }
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        Responsable r = doc.toObject(Responsable.class);
        if (r != null) {
            r.setId(doc.getId());
        }
        return r;
    }

    @Cacheable(value = "responsables", key = "'asignaciones:' + #responsableId")
    public List<AsignacionResponsable> findAsignaciones(String responsableId)
            throws ExecutionException, InterruptedException {
        if (responsableId == null || responsableId.isBlank()) {
            return List.of();
        }
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .document(responsableId)
                .collection(SUB_ASIGNACIONES)
                .get();
        List<AsignacionResponsable> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            AsignacionResponsable a = doc.toObject(AsignacionResponsable.class);
            if (a != null) {
                if (a.getComputadoraUuid() == null) {
                    a.setComputadoraUuid(doc.getId());
                }
                result.add(a);
            }
        }
        return result;
    }

    @CacheEvict(value = "responsables", allEntries = true)
    public void registrarAsignacion(String responsableId, String nombreVisible, String computadoraUuid,
            String hostname, String ubicacion) throws ExecutionException, InterruptedException {
        if (responsableId == null || responsableId.isBlank() || computadoraUuid == null || computadoraUuid.isBlank()) {
            return;
        }
        DocumentReference responsableRef = firestore.collection(collectionName).document(responsableId);
        DocumentReference asignacionRef = responsableRef.collection(SUB_ASIGNACIONES).document(computadoraUuid);
        Timestamp now = Timestamp.now();

        firestore.runTransaction(transaction -> {
            DocumentSnapshot responsableDoc = transaction.get(responsableRef).get();
            Map<String, Object> responsableData = new HashMap<>();
            responsableData.put("nombre", nombreVisible != null && !nombreVisible.isBlank()
                    ? nombreVisible.trim()
                    : responsableId);
            responsableData.put("actualizado_at", now);
            if (!responsableDoc.exists()) {
                responsableData.put("cantidad_equipos", 1);
                transaction.set(responsableRef, responsableData);
            } else {
                int actual = responsableDoc.contains("cantidad_equipos")
                        ? responsableDoc.getLong("cantidad_equipos").intValue()
                        : 0;
                boolean yaExistia = transaction.get(asignacionRef).get().exists();
                responsableData.put("cantidad_equipos", yaExistia ? actual : actual + 1);
                transaction.set(responsableRef, responsableData, com.google.cloud.firestore.SetOptions.merge());
            }

            Map<String, Object> asignacionData = new HashMap<>();
            asignacionData.put("computadora_uuid", computadoraUuid);
            asignacionData.put("hostname", hostname);
            asignacionData.put("ubicacion", ubicacion);
            asignacionData.put("asignado_at", now);
            transaction.set(asignacionRef, asignacionData);
            return null;
        }).get();
    }

    @CacheEvict(value = "responsables", allEntries = true)
    public void quitarAsignacion(String responsableId, String computadoraUuid)
            throws ExecutionException, InterruptedException {
        if (responsableId == null || responsableId.isBlank() || computadoraUuid == null || computadoraUuid.isBlank()) {
            return;
        }
        DocumentReference responsableRef = firestore.collection(collectionName).document(responsableId);
        DocumentReference asignacionRef = responsableRef.collection(SUB_ASIGNACIONES).document(computadoraUuid);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot asignacionDoc = transaction.get(asignacionRef).get();
            if (!asignacionDoc.exists()) {
                return null;
            }
            transaction.delete(asignacionRef);

            DocumentSnapshot responsableDoc = transaction.get(responsableRef).get();
            if (!responsableDoc.exists()) {
                return null;
            }
            int actual = responsableDoc.contains("cantidad_equipos")
                    ? responsableDoc.getLong("cantidad_equipos").intValue()
                    : 0;
            int nuevo = Math.max(0, actual - 1);
            if (nuevo == 0) {
                transaction.delete(responsableRef);
            } else {
                Map<String, Object> updates = new HashMap<>();
                updates.put("cantidad_equipos", nuevo);
                updates.put("actualizado_at", Timestamp.now());
                transaction.update(responsableRef, updates);
            }
            return null;
        }).get();
    }

    @CacheEvict(value = "responsables", allEntries = true)
    public void limpiarColeccion() throws ExecutionException, InterruptedException {
        CollectionReference col = firestore.collection(collectionName);
        ApiFuture<QuerySnapshot> future = col.get();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            deleteResponsableConAsignaciones(doc.getReference());
        }
    }

    private void deleteResponsableConAsignaciones(DocumentReference responsableRef)
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> asignaciones = responsableRef.collection(SUB_ASIGNACIONES).get();
        WriteBatch batch = firestore.batch();
        int ops = 0;
        for (QueryDocumentSnapshot doc : asignaciones.get().getDocuments()) {
            batch.delete(doc.getReference());
            ops++;
            if (ops >= 450) {
                batch.commit().get();
                batch = firestore.batch();
                ops = 0;
            }
        }
        batch.delete(responsableRef);
        batch.commit().get();
    }
}
