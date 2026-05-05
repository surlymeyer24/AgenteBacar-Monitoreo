package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.util.FirestoreJsonHelper;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteBatch;

@Repository
public class ComputadoraRepository {

    private final Firestore firestore;
    private final String collectionName;
    private final String programasSubcollection;

    public ComputadoraRepository(Firestore firestore,
                                  @Value("${firebase.collection.computadoras}") String collectionName,
                                  @Value("${firebase.subcollection.computadora-programas:programas}")
                                  String programasSubcollection) {
        this.firestore = firestore;
        this.collectionName = collectionName;
        this.programasSubcollection = programasSubcollection;
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

    public List<Computadora> findByUbicacion(Ubicacion ubicacion) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("ubicacion", ubicacion.name())
                .get();
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

    /**
     * Lista documentos de la subcolección {@code programas} del agente bajo la computadora {@code uuid}.
     */
    public List<Map<String, Object>> listProgramas(String uuid) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .document(uuid)
                .collection(programasSubcollection)
                .get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Map<String, Object>> out = new ArrayList<>(docs.size());
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("documentoId", doc.getId());
            Map<String, Object> data = doc.getData();
            if (data != null) {
                for (Map.Entry<String, Object> e : data.entrySet()) {
                    row.put(e.getKey(), FirestoreJsonHelper.toJsonFriendly(e.getValue()));
                }
            }
            out.add(row);
        }
        return out;
    }

    public String create(Computadora computadora) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(computadora.getUuid());
        ref.set(computadora).get();
        return computadora.getUuid();
    }

    /**
     * Elimina la computadora y los documentos de la subcolección {@code programas}.
     * En Firestore borrar el documento padre no elimina subcolecciones automáticamente.
     *
     * @return {@code true} si existía el documento y se eliminó
     */
    public boolean deleteByUuid(String uuid) throws ExecutionException, InterruptedException {
        DocumentReference pcRef = firestore.collection(collectionName).document(uuid);
        DocumentSnapshot snap = pcRef.get().get();
        if (!snap.exists()) {
            return false;
        }
        CollectionReference progRef = pcRef.collection(programasSubcollection);
        List<QueryDocumentSnapshot> progDocs = progRef.get().get().getDocuments();
        final int batchMax = 500;
        for (int i = 0; i < progDocs.size(); i += batchMax) {
            WriteBatch batch = firestore.batch();
            int end = Math.min(i + batchMax, progDocs.size());
            for (int j = i; j < end; j++) {
                batch.delete(progDocs.get(j).getReference());
            }
            batch.commit().get();
        }
        pcRef.delete().get();
        return true;
    }

    public void agregarImpresora(String uuid, ImpresoraFirestore impresora) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.impresoras", FieldValue.arrayUnion(toMap(impresora)))
                .get();
    }

    public void agregarMonitor(String uuid, MonitorFirestore monitor) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.monitores", FieldValue.arrayUnion(toMap(monitor)))
                .get();
    }

    public void agregarDispositivoUsb(String uuid, DispositivoUsbFirestore usb) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.dispositivos_usb", FieldValue.arrayUnion(toMap(usb)))
                .get();
    }

    public void agregarAudioEntrada(String uuid, DispositivoAudioFirestore audio) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.audio.entrada", FieldValue.arrayUnion(toMap(audio)))
                .get();
    }

    public void agregarAudioSalida(String uuid, DispositivoAudioFirestore audio) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uuid)
                .update("perifericos.audio.salida", FieldValue.arrayUnion(toMap(audio)))
                .get();
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

    private static Map<String, Object> toMap(ImpresoraFirestore imp) {
        Map<String, Object> m = new HashMap<>();
        if (imp.getNombre() != null) m.put("nombre", imp.getNombre());
        if (imp.getDriver() != null) m.put("driver", imp.getDriver());
        if (imp.getPuerto() != null) m.put("puerto", imp.getPuerto());
        if (imp.getTipo() != null) m.put("tipo", imp.getTipo());
        if (imp.getTipoImpresora() != null) m.put("tipo_impresora", imp.getTipoImpresora());
        if (imp.getEstado() != null) m.put("estado", imp.getEstado());
        if (imp.getCompartida() != null) m.put("compartida", imp.getCompartida());
        if (imp.getPredeterminada() != null) m.put("predeterminada", imp.getPredeterminada());
        return m;
    }

    private static Map<String, Object> toMap(MonitorFirestore mon) {
        Map<String, Object> m = new HashMap<>();
        if (mon.getNombre() != null) m.put("nombre", mon.getNombre());
        if (mon.getResolucion() != null) m.put("resolucion", mon.getResolucion());
        if (mon.getPulgadas() != null) m.put("pulgadas", mon.getPulgadas());
        if (mon.getAnchoCm() != null) m.put("ancho_cm", mon.getAnchoCm());
        if (mon.getAltoCm() != null) m.put("alto_cm", mon.getAltoCm());
        return m;
    }

    private static Map<String, Object> toMap(DispositivoUsbFirestore usb) {
        Map<String, Object> m = new HashMap<>();
        if (usb.getNombre() != null) m.put("nombre", usb.getNombre());
        if (usb.getFabricante() != null) m.put("fabricante", usb.getFabricante());
        if (usb.getCategoria() != null) m.put("categoria", usb.getCategoria());
        if (usb.getClase() != null) m.put("clase", usb.getClase());
        if (usb.getConexion() != null) m.put("conexion", usb.getConexion());
        return m;
    }

    private static Map<String, Object> toMap(DispositivoAudioFirestore audio) {
        Map<String, Object> m = new HashMap<>();
        if (audio.getNombre() != null) m.put("nombre", audio.getNombre());
        if (audio.getFabricante() != null) m.put("fabricante", audio.getFabricante());
        if (audio.getEstado() != null) m.put("estado", audio.getEstado());
        return m;
    }

    private Computadora documentToComputadora(DocumentSnapshot doc) {
        Computadora c = doc.toObject(Computadora.class);
        if (c == null) {
            c = new Computadora();
        }
        if (c.getUuid() == null || c.getUuid().isBlank()) {
            c.setUuid(doc.getId());
        }
        c.setUbicacion(Ubicacion.normalizar(c.getUbicacion()));
        Map<String, Object> data = doc.getData();
        if (data == null) {
            return c;
        }

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

    public void actualizarResponsableInventario(String uuid, String nuevoRI) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(uuid);
        docRef.update("responsable_inventario", nuevoRI).get();
    }
}
