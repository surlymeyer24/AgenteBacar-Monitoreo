package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.Ubicacion;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class ComputadoraRepository {

    private final Firestore firestore;
    private final String collectionName;

    public ComputadoraRepository(Firestore firestore,
                                  @Value("${firebase.collection.computadoras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public List<Computadora> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Computadora> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(documentToComputadora(doc));
        }
        return result;
    }

    public Computadora findByUuid(String uuid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(uuid).get().get();
        if (!doc.exists()) {
            return null;
        }
        return documentToComputadora(doc);
    }

    public void updateUbicacion(String uuid, Ubicacion ubicacion) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid).update("ubicacion", ubicacion.name()).get();
    }

    public Computadora findByHostname(String hostname) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName)
                .whereEqualTo("hostname", hostname).get().get()
                .getDocuments().stream().findFirst().orElse(null);
        if (doc == null || !doc.exists()) {
            return null;
        }
        return documentToComputadora(doc);
    }

    private Computadora documentToComputadora(DocumentSnapshot doc) {
        Computadora c = doc.toObject(Computadora.class);
        Map<String, Object> data = doc.getData();

        // Extraer usuarioActual del mapa anidado "usuarios"
        Object usuariosObj = data.get("usuarios");
        if (usuariosObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> usuarios = (Map<String, Object>) usuariosObj;
            c.setUsuarioActual((String) usuarios.get("usuario_actual"));
        }

        return c;
    }
    public void cambiarEstado(String uuid, Estado nuevoEstado, String motivo) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Documento no encontrado: " + uuid);
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
