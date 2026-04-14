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

    private static Camara snapshotToCamara(DocumentSnapshot doc) {
        Camara c = doc.toObject(Camara.class);
        if (c == null) {
            c = new Camara();
        }
        c.setId(doc.getId());
        return c;
    }

    public void cambiarEstado(String id, Estado nuevoEstado, String motivo) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Cámara no encontrada: " + id);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
            if (historial == null) {
                historial = new ArrayList<>();
            } else {
                historial = new ArrayList<>(historial);
            }

            // Cerrar el estado vigente (fechaHoraFin == null)
            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
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
            nuevaEntrada.put("motivo", motivo);
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
}
