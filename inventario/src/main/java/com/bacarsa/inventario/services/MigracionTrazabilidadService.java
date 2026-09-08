package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MigracionTrazabilidadResultDTO;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.OrigenAlta;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteBatch;

@Service
public class MigracionTrazabilidadService {

    private static final Logger log = LoggerFactory.getLogger(MigracionTrazabilidadService.class);
    private static final int BATCH_MAX = 500;
    private static final int MAX_ERRORES = 50;

    private final Firestore firestore;
    private final String collectionName;

    public MigracionTrazabilidadService(Firestore firestore,
            @Value("${firebase.collection.computadoras}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @Caching(evict = {
            @CacheEvict(value = "pc-listado", allEntries = true),
            @CacheEvict(value = "pc-detalle", allEntries = true),
            @CacheEvict(value = "computadoras-gordo", allEntries = true)
    })
    @SuppressWarnings("unchecked")
    public MigracionTrazabilidadResultDTO migrar() throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection(collectionName).get().get().getDocuments();

        MigracionTrazabilidadResultDTO result = new MigracionTrazabilidadResultDTO();
        WriteBatch batch = firestore.batch();
        int pendientes = 0;

        for (QueryDocumentSnapshot doc : docs) {
            result.setProcesados(result.getProcesados() + 1);

            try {
                String origenExistente = doc.getString("origen_alta");
                if (origenExistente != null && !origenExistente.isBlank()) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }

                Map<String, Object> updates = new HashMap<>();

                boolean tieneSincronizacion = doc.getTimestamp("ultima_sincronizacion") != null;
                String estadoActualNombre = extraerEstadoActualNombre(doc);

                if (!tieneSincronizacion && "Sin Asignar".equalsIgnoreCase(estadoActualNombre)) {
                    updates.put("origen_alta", OrigenAlta.STOCK.name());
                    updates.put("estado_conciliacion", EstadoConciliacion.SIN_BASELINE.name());
                    result.setStockRetroactivo(result.getStockRetroactivo() + 1);
                } else {
                    updates.put("origen_alta", OrigenAlta.LEGACY.name());
                    updates.put("estado_conciliacion", EstadoConciliacion.NO_APLICA.name());
                    result.setLegacy(result.getLegacy() + 1);
                }

                batch.update(doc.getReference(), updates);
                result.setMigrados(result.getMigrados() + 1);
                pendientes++;

                if (pendientes >= BATCH_MAX) {
                    batch.commit().get();
                    batch = firestore.batch();
                    pendientes = 0;
                }
            } catch (Exception e) {
                log.error("Error migrando doc {}: {}", doc.getId(), e.getMessage());
                if (result.getErrores().size() < MAX_ERRORES) {
                    result.getErrores().add(doc.getId() + ": " + e.getMessage());
                }
            }
        }

        if (pendientes > 0) {
            batch.commit().get();
        }

        log.info("Migración trazabilidad completada: {} procesados, {} migrados ({} legacy, {} stock retro), {} skipped",
                result.getProcesados(), result.getMigrados(), result.getLegacy(),
                result.getStockRetroactivo(), result.getSkipped());

        return result;
    }

    @SuppressWarnings("unchecked")
    private String extraerEstadoActualNombre(QueryDocumentSnapshot doc) {
        Object estadoActualObj = doc.get("estadoActual");
        if (estadoActualObj instanceof Map) {
            Object nombre = ((Map<String, Object>) estadoActualObj).get("nombre");
            if (nombre instanceof String s) return s;
        }

        List<Map<String, Object>> historial = (List<Map<String, Object>>) doc.get("historialEstados");
        if (historial != null) {
            for (int i = historial.size() - 1; i >= 0; i--) {
                Map<String, Object> entrada = historial.get(i);
                if (entrada.get("fechaHoraFin") != null) continue;
                Object estadoObj = entrada.get("estado");
                if (estadoObj instanceof Map) {
                    Object nombre = ((Map<String, Object>) estadoObj).get("nombre");
                    if (nombre instanceof String s) return s;
                }
            }
        }
        return null;
    }
}
