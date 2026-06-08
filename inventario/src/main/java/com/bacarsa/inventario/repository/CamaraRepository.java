package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Estado;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class CamaraRepository {

    private final Firestore firestore;
    private final String collectionName;

    public CamaraRepository(Firestore firestore,
            @Value("${firebase.collection.camaras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public List<Camara> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    public List<Camara> findByUbicacion(String ubicacion) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("ubicacion", ubicacion)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    public Camara findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToCamara(doc);
    }

    public String create(Camara camara) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(camara).get();
        return ref.getId();
    }

    /** Persiste con ID fijo (p. ej. importación masiva); sobrescribe el documento si ya existe. */
    public void guardarConId(String id, Camara camara) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        camara.setId(null);
        ref.set(camara).get();
    }

    private static Camara snapshotToCamara(DocumentSnapshot doc) {
        Camara c = doc.toObject(Camara.class);
        if (c == null) {
            c = new Camara();
        }
        c.setId(doc.getId());
        return c;
    }

    public void updateUbicacion(String id, String ubicacion) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        ref.update("ubicacion", ubicacion).get();
    }

    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        docRef.update(campos).get();
    }

    public void cambiarEstado(String id, Estado nuevoEstado, String motivo) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        String motivoGuardado = motivo != null ? motivo : "";

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Cámara no encontrada: " + id);
            }

            List<Map<String, Object>> historial = copiarHistorialMutableDesdeSnapshot(doc);

            // Cerrar el estado vigente (fechaHoraFin == null)
            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada == null) {
                    continue;
                }
                if (entrada.get("fechaHoraFin") == null) {
                    Map<String, Object> copia = new HashMap<>(entrada);
                    copia.put("fechaHoraFin", ahora);
                    historial.set(i, copia);
                }
            }

            // Nueva entrada de estado
            Map<String, Object> estadoMap = new HashMap<>();
            estadoMap.put("nombre", nuevoEstado.getNombre());
            estadoMap.put("descripcion", nuevoEstado.getDescripcion());

            Map<String, Object> nuevaEntrada = new HashMap<>();
            nuevaEntrada.put("estado", estadoMap);
            nuevaEntrada.put("motivo", motivoGuardado);
            nuevaEntrada.put("fechaHoraInicio", ahora);
            nuevaEntrada.put("fechaHoraFin", null);

            historial.add(nuevaEntrada);

            // Escribir historial + actualizar estadoActual top-level
            transaction.update(docRef,
                    "historialEstados", historial,
                    "estadoActual", estadoMap);

            return null;
        }).get();
    }

    /**
     * Lee {@code historialEstados} como lista de mapas mutables. Si el campo no es una lista o
     * contiene elementos no mapa (p. ej. datos legacy), se ignoran esas entradas para no romper la transacción.
     */
    private static List<Map<String, Object>> copiarHistorialMutableDesdeSnapshot(DocumentSnapshot doc) {
        Object raw = doc.get("historialEstados");
        List<Map<String, Object>> historial = new ArrayList<>();
        if (!(raw instanceof List<?> lista)) {
            return historial;
        }
        for (Object item : lista) {
            if (!(item instanceof Map<?, ?> m)) {
                continue;
            }
            Map<String, Object> entrada = new HashMap<>();
            for (Map.Entry<?, ?> e : m.entrySet()) {
                if (e.getKey() != null) {
                    entrada.put(String.valueOf(e.getKey()), e.getValue());
                }
            }
            historial.add(entrada);
        }
        return historial;
    }

    public List<Camara> findByNvrId(String nvrId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("nvrId", nvrId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Camara> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToCamara(doc));
        }
        return result;
    }

    public void updateNvrId(String id, String nvrId) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        ref.update("nvrId", nvrId).get();
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    /**
     * Recorre la colección una vez: id de NVR → cantidad de cámaras con ese {@code nvrId}.
     */
    public Map<String, Long> contarCamarasPorNvrId() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        Map<String, Long> out = new HashMap<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            String nvrId = doc.getString("nvrId");
            if (nvrId == null || nvrId.isBlank()) {
                continue;
            }
            out.merge(nvrId.trim(), 1L, Long::sum);
        }
        return out;
    }

    public int contarPorNvrId(String nvrId) throws ExecutionException, InterruptedException {
        if (nvrId == null || nvrId.isBlank()) {
            return 0;
        }
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("nvrId", nvrId.trim())
                .get();
        return future.get().getDocuments().size();
    }
}
