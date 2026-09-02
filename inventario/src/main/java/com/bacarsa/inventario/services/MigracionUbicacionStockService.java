package com.bacarsa.inventario.services;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MigracionUbicacionStockResultDTO;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteBatch;

@Service
public class MigracionUbicacionStockService {

    private static final int BATCH_MAX = 500;
    private static final int MAX_ERRORES = 25;

    private final Firestore firestore;
    private final String collectionName;

    public MigracionUbicacionStockService(Firestore firestore,
            @Value("${firebase.collection.computadoras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    public MigracionUbicacionStockResultDTO migrar() throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection(collectionName).get().get().getDocuments();

        MigracionUbicacionStockResultDTO result = new MigracionUbicacionStockResultDTO();
        WriteBatch batch = firestore.batch();
        int pendientes = 0;

        for (QueryDocumentSnapshot doc : docs) {
            result.setProcesados(result.getProcesados() + 1);

            try {
                String ubicacionStock = extraerUbicacionStockVigente(doc);

                if (ubicacionStock != null) {
                    batch.update(doc.getReference(), "ubicacion_stock", ubicacionStock);
                    result.setActualizados(result.getActualizados() + 1);
                } else {
                    Object existente = doc.get("ubicacion_stock");
                    if (existente != null) {
                        batch.update(doc.getReference(), "ubicacion_stock", FieldValue.delete());
                        result.setLimpiados(result.getLimpiados() + 1);
                    } else {
                        continue;
                    }
                }

                pendientes++;
                if (pendientes >= BATCH_MAX) {
                    batch.commit().get();
                    batch = firestore.batch();
                    pendientes = 0;
                }
            } catch (Exception e) {
                if (result.getErrores().size() < MAX_ERRORES) {
                    result.getErrores().add(doc.getId() + ": " + e.getMessage());
                }
            }
        }

        if (pendientes > 0) {
            batch.commit().get();
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    private String extraerUbicacionStockVigente(DocumentSnapshot doc) {
        List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
        if (historial == null || historial.isEmpty()) {
            return null;
        }

        for (int i = historial.size() - 1; i >= 0; i--) {
            Map<String, Object> entrada = historial.get(i);
            if (entrada.get("fechaHoraFin") != null) {
                continue;
            }

            Object estadoObj = entrada.get("estado");
            if (!(estadoObj instanceof Map)) {
                continue;
            }
            Map<String, Object> estadoMap = (Map<String, Object>) estadoObj;
            String nombre = (String) estadoMap.get("nombre");

            if (!"Sin Asignar".equalsIgnoreCase(nombre)) {
                return null;
            }

            Object raw = entrada.get("ubicacion_stock");
            if (raw == null) {
                raw = entrada.get("ubicacionStock");
            }
            if (raw instanceof String s && !s.isBlank()) {
                return s.trim();
            }
            return null;
        }

        return null;
    }
}
