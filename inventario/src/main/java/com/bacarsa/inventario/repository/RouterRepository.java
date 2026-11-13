package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.concurrent.ExecutionException;
import java.util.function.BiFunction;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.historial.HistorialLectura;
import com.google.cloud.firestore.FieldValue;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.Router;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;

@Repository
public class RouterRepository {

    private final Firestore firestore;
    private final String collectionName;

    public RouterRepository(Firestore firestore,
            @Value("${firebase.collection.routers}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("routers")
    public List<Router> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Router> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToRouter(doc));
        }
        return result;
    }

    @Cacheable(value = "routers", key = "#id")
    public Router findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToRouter(doc);
    }

    @CacheEvict(value = "routers", allEntries = true)
    public String create(Router router) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document();
        ref.set(router).get();
        return ref.getId();
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void guardarConId(String id, Router router) throws ExecutionException, InterruptedException {
        router.setId(id);
        firestore.collection(collectionName).document(id).set(router).get();
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void cambiarEstado(String id, Estado nuevoEstado, String motivo) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);

        firestore.runTransaction(transaction -> {
            DocumentSnapshot doc = transaction.get(docRef).get();
            if (!doc.exists()) {
                throw new IllegalArgumentException("Router no encontrado: " + id);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
            if (historial == null) {
                historial = new ArrayList<>();
            } else {
                historial = new ArrayList<>(historial);
            }

            Timestamp ahora = Timestamp.now();
            for (int i = 0; i < historial.size(); i++) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada.get("fechaHoraFin") == null) {
                    Map<String, Object> copia = new HashMap<>(entrada);
                    copia.put("fechaHoraFin", ahora);
                    historial.set(i, copia);
                }
            }

            Map<String, Object> estadoMap = new HashMap<>();
            estadoMap.put("nombre", nuevoEstado.getNombre());
            estadoMap.put("descripcion", nuevoEstado.getDescripcion());

            Map<String, Object> nuevaEntrada = new HashMap<>();
            nuevaEntrada.put("estado", estadoMap);
            nuevaEntrada.put("motivo", motivo);
            nuevaEntrada.put("fechaHoraInicio", ahora);
            nuevaEntrada.put("fechaHoraFin", null);

            historial.add(nuevaEntrada);

            transaction.update(docRef,
                    "historialEstados", historial,
                    "estadoActual", estadoMap);

            return null;
        }).get();
    }

    private static Router snapshotToRouter(DocumentSnapshot doc) {
        Router r = doc.toObject(Router.class);
        if (r == null) {
            r = new Router();
        }
        r.setId(doc.getId());
        r.setHistorial(HistorialLectura.desdeDocumento(doc.getData()));
        return r;
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void aplicarHistorial(String id, BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> plan)
            throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(id);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot doc = transaction.get(ref).get();
                Map<String, Object> data = doc.exists() ? doc.getData() : null;
                EscrituraHistorial escritura = plan.apply(data, Timestamp.now());
                if (escritura.modo() == EscrituraHistorial.Modo.NADA) {
                    return null;
                }
                Map<String, Object> campos = conBorrados(escritura.campos());
                if (!doc.exists()) {
                    if (escritura.modo() != EscrituraHistorial.Modo.CREAR_CON_HISTORIAL) {
                        throw new IllegalArgumentException("Router no encontrado: " + id);
                    }
                    transaction.set(ref, campos);
                } else {
                    transaction.update(ref, campos);
                }
                return null;
            }).get();
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof RuntimeException re) throw re;
            throw ex;
        }
    }

    private static Map<String, Object> conBorrados(Map<String, Object> campos) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : campos.entrySet()) {
            out.put(entry.getKey(), entry.getValue() == null ? FieldValue.delete() : entry.getValue());
        }
        return out;
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void update(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        docRef.update(campos).get();
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void actualizar(String id, Map<String, Object> campos) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).set(campos, SetOptions.merge()).get();
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void deleteById(String id) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(id).delete().get();
    }

    @CacheEvict(value = "routers", allEntries = true)
    public void mergeCodigoInterno(String id, String codigo) throws ExecutionException, InterruptedException {
        if (id == null || id.isBlank() || codigo == null || codigo.isBlank()) {
            return;
        }
        firestore.collection(collectionName).document(id)
                .set(MergeCodigoInterno.unSoloCampo(codigo), SetOptions.merge()).get();
    }
}