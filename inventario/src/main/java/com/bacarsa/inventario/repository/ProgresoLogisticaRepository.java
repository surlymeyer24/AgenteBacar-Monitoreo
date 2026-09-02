package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.dto.ActividadLogisticaDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaResumenDTO;
import com.bacarsa.inventario.dto.UsuarioAuditoriaDTO;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;

@Repository
public class ProgresoLogisticaRepository {

    private static final String SUBCOLECCION_HISTORIAL = "historial";
    private static final List<String> FASES = List.of("etiquetado", "embalado", "destino");

    private final Firestore firestore;
    private final String collectionName;

    public ProgresoLogisticaRepository(
            Firestore firestore,
            @Value("${firebase.collection.progreso_logistica_qr}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Cacheable("progresoLogisticaResumen")
    public Map<String, ProgresoLogisticaResumenDTO> findAllResumen()
            throws ExecutionException, InterruptedException {
        QuerySnapshot snapshot = firestore.collection(collectionName).get().get();
        Map<String, ProgresoLogisticaResumenDTO> resultado = new HashMap<>();
        for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
            resultado.put(doc.getId(), snapshotToResumen(doc));
        }
        return resultado;
    }

    public ProgresoLogisticaDTO findByUuid(String uuid)
            throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection(collectionName).document(uuid);
        DocumentSnapshot doc = ref.get().get();
        if (!doc.exists()) {
            return progresoVacio(uuid);
        }

        QuerySnapshot historialSnapshot = ref.collection(SUBCOLECCION_HISTORIAL)
                .orderBy("fecha_hora", com.google.cloud.firestore.Query.Direction.DESCENDING)
                .limit(50)
                .get()
                .get();
        List<ActividadLogisticaDTO> historial = new ArrayList<>();
        for (QueryDocumentSnapshot actividad : historialSnapshot.getDocuments()) {
            historial.add(snapshotToActividad(actividad));
        }
        return snapshotToDto(doc, historial);
    }

    @CacheEvict(value = "progresoLogisticaResumen", allEntries = true)
    public void actualizar(
            String uuid,
            String fase,
            List<String> itemIds,
            boolean completado,
            List<String> todosLosItemIds,
            UsuarioAuditoriaDTO usuario)
            throws ExecutionException, InterruptedException {

        DocumentReference progresoRef = firestore.collection(collectionName).document(uuid);
        DocumentReference actividadRef = progresoRef.collection(SUBCOLECCION_HISTORIAL).document();

        firestore.runTransaction(transaction -> {
            DocumentSnapshot actual = transaction.get(progresoRef).get();
            Map<String, Set<String>> marcas = leerMarcas(actual);
            Set<String> idsVigentes = new LinkedHashSet<>(todosLosItemIds);

            for (String nombreFase : FASES) {
                marcas.get(nombreFase).retainAll(idsVigentes);
            }

            if (completado) {
                marcas.get(fase).addAll(itemIds);
            } else {
                marcas.get(fase).removeAll(itemIds);
            }

            Timestamp ahora = Timestamp.now();
            int total = idsVigentes.size();
            int etiquetadoPct = porcentaje(marcas.get("etiquetado").size(), total);
            int embaladoPct = porcentaje(marcas.get("embalado").size(), total);
            int destinoPct = porcentaje(marcas.get("destino").size(), total);

            Map<String, Object> data = new HashMap<>();
            data.put("uuid", uuid);
            data.put("total_items", total);
            data.put("marcas", marcasParaFirestore(marcas));
            data.put("etiquetado_pct", etiquetadoPct);
            data.put("embalado_pct", embaladoPct);
            data.put("destino_pct", destinoPct);
            data.put("estado", calcularEstado(etiquetadoPct, embaladoPct, destinoPct, marcas));
            data.put("ultima_actualizacion", ahora);
            data.put("ultimo_usuario", usuarioParaFirestore(usuario));
            transaction.set(progresoRef, data, SetOptions.merge());

            Map<String, Object> actividad = new HashMap<>();
            actividad.put("fase", fase);
            actividad.put("accion", completado ? "MARCAR" : "DESMARCAR");
            actividad.put("item_ids", List.copyOf(itemIds));
            actividad.put("usuario", usuarioParaFirestore(usuario));
            actividad.put("fecha_hora", ahora);
            transaction.set(actividadRef, actividad);
            return null;
        }).get();
    }

    private static Map<String, Set<String>> leerMarcas(DocumentSnapshot doc) {
        Map<String, Set<String>> resultado = new LinkedHashMap<>();
        for (String fase : FASES) {
            resultado.put(fase, new LinkedHashSet<>());
        }
        if (doc == null || !doc.exists()) {
            return resultado;
        }

        Object rawMarcas = doc.get("marcas");
        if (!(rawMarcas instanceof Map<?, ?> mapa)) {
            return resultado;
        }
        for (String fase : FASES) {
            Object rawIds = mapa.get(fase);
            if (!(rawIds instanceof List<?> lista)) continue;
            for (Object id : lista) {
                if (id != null) resultado.get(fase).add(String.valueOf(id));
            }
        }
        return resultado;
    }

    private static Map<String, Object> marcasParaFirestore(Map<String, Set<String>> marcas) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        for (String fase : FASES) {
            resultado.put(fase, new ArrayList<>(marcas.get(fase)));
        }
        return resultado;
    }

    private static Map<String, Map<String, Boolean>> marcasParaDto(DocumentSnapshot doc) {
        Map<String, Set<String>> marcas = leerMarcas(doc);
        Map<String, Map<String, Boolean>> resultado = new LinkedHashMap<>();
        for (String fase : FASES) {
            Map<String, Boolean> porItem = new LinkedHashMap<>();
            for (String id : marcas.get(fase)) {
                porItem.put(id, true);
            }
            resultado.put(fase, porItem);
        }
        return resultado;
    }

    private static ProgresoLogisticaDTO snapshotToDto(
            DocumentSnapshot doc, List<ActividadLogisticaDTO> historial) {
        ProgresoLogisticaDTO dto = new ProgresoLogisticaDTO();
        dto.setUuid(doc.getId());
        dto.setMarcas(marcasParaDto(doc));
        dto.setTotalItems(numeroEntero(doc.getLong("total_items")));
        dto.setEtiquetadoPct(numeroEntero(doc.getLong("etiquetado_pct")));
        dto.setEmbaladoPct(numeroEntero(doc.getLong("embalado_pct")));
        dto.setDestinoPct(numeroEntero(doc.getLong("destino_pct")));
        dto.setEstado(doc.getString("estado"));
        dto.setUltimaActualizacion(timestampIso(doc.getTimestamp("ultima_actualizacion")));
        dto.setUltimoUsuario(mapToUsuario(doc.get("ultimo_usuario")));
        dto.setHistorial(historial);
        return dto;
    }

    private static ProgresoLogisticaResumenDTO snapshotToResumen(DocumentSnapshot doc) {
        return new ProgresoLogisticaResumenDTO(
                doc.getId(),
                numeroEntero(doc.getLong("etiquetado_pct")),
                numeroEntero(doc.getLong("embalado_pct")),
                numeroEntero(doc.getLong("destino_pct")),
                doc.getString("estado"));
    }

    private static ActividadLogisticaDTO snapshotToActividad(DocumentSnapshot doc) {
        ActividadLogisticaDTO dto = new ActividadLogisticaDTO();
        dto.setFase(doc.getString("fase"));
        dto.setAccion(doc.getString("accion"));
        dto.setItemIds(toStringList(doc.get("item_ids")));
        dto.setUsuario(mapToUsuario(doc.get("usuario")));
        dto.setFechaHora(timestampIso(doc.getTimestamp("fecha_hora")));
        return dto;
    }

    private static ProgresoLogisticaDTO progresoVacio(String uuid) {
        ProgresoLogisticaDTO dto = new ProgresoLogisticaDTO();
        dto.setUuid(uuid);
        Map<String, Map<String, Boolean>> marcas = new LinkedHashMap<>();
        for (String fase : FASES) {
            marcas.put(fase, new LinkedHashMap<>());
        }
        dto.setMarcas(marcas);
        dto.setEstado("PENDIENTE");
        dto.setHistorial(List.of());
        return dto;
    }

    private static int porcentaje(int marcados, int total) {
        return total == 0 ? 0 : (int) Math.round((marcados * 100.0) / total);
    }

    private static String calcularEstado(
            int etiquetadoPct,
            int embaladoPct,
            int destinoPct,
            Map<String, Set<String>> marcas) {
        if (destinoPct == 100) return "EN_DESTINO";
        if (embaladoPct == 100) return "EMBALADO";
        if (etiquetadoPct == 100) return "ETIQUETADO";
        boolean hayActividad = marcas.values().stream().anyMatch(ids -> !ids.isEmpty());
        return hayActividad ? "EN_CURSO" : "PENDIENTE";
    }

    private static Map<String, Object> usuarioParaFirestore(UsuarioAuditoriaDTO usuario) {
        Map<String, Object> data = new HashMap<>();
        data.put("uid", usuario.getUid());
        data.put("nombre", usuario.getNombre());
        data.put("email", usuario.getEmail());
        return data;
    }

    private static UsuarioAuditoriaDTO mapToUsuario(Object raw) {
        if (!(raw instanceof Map<?, ?> mapa)) return null;
        return new UsuarioAuditoriaDTO(
                stringONull(mapa.get("uid")),
                stringONull(mapa.get("nombre")),
                stringONull(mapa.get("email")));
    }

    private static List<String> toStringList(Object raw) {
        if (!(raw instanceof List<?> lista)) return List.of();
        return lista.stream().filter(item -> item != null).map(String::valueOf).toList();
    }

    private static String stringONull(Object valor) {
        return valor == null ? null : String.valueOf(valor);
    }

    private static int numeroEntero(Long valor) {
        return valor == null ? 0 : valor.intValue();
    }

    private static String timestampIso(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toSqlTimestamp().toInstant().toString();
    }
}
