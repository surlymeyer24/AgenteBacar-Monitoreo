package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class NormalizacionStockService {

    private static final Logger log = LoggerFactory.getLogger(NormalizacionStockService.class);

    private static final Set<String> TIPOS_CANONICOS = Set.of(
            "computadora", "camara_ip", "teclado", "mouse", "monitor",
            "impresora", "webcam", "parlante", "microfono", "router",
            "switch", "access_point", "telefono_ip", "otro");

    private static final Map<String, String> ALIAS_TIPO = Map.ofEntries(
            Map.entry("camara web", "webcam"),
            Map.entry("camara_web", "webcam"),
            Map.entry("cam web", "webcam"),
            Map.entry("pc", "computadora"),
            Map.entry("desktop", "computadora"),
            Map.entry("notebook", "computadora"),
            Map.entry("laptop", "computadora"),
            Map.entry("mini_pc", "computadora"),
            Map.entry("celular", "telefono_ip"),
            Map.entry("televisor", "otro"));

    private static final Set<String> UBICACIONES_DEPOSITO = Set.of(
            "stock", "stock - usado", "stock - nuevo", "deposito", "depósito", "");

    private final PerifericoManualRepository repository;

    public NormalizacionStockService(PerifericoManualRepository repository) {
        this.repository = repository;
    }

    public record CambioDoc(String id, String campo, String antes, String despues) {}
    public record ResultadoNormalizacion(int documentos, int cambios, int errores, List<List<CambioDoc>> detalle) {}

    public ResultadoNormalizacion ejecutar(boolean dryRun) throws ExecutionException, InterruptedException {
        List<PerifericoManual> todos = repository.findAll();
        List<List<CambioDoc>> detalle = new ArrayList<>();
        int totalCambios = 0;
        int errores = 0;

        for (PerifericoManual p : todos) {
            if (p == null) continue;
            List<CambioDoc> cambiosDoc = new ArrayList<>();
            Map<String, Object> updates = new LinkedHashMap<>();

            normalizarTipo(p, cambiosDoc, updates);
            normalizarUbicacion(p, cambiosDoc, updates);
            normalizarMarcaModelo(p, cambiosDoc, updates);
            normalizarCondicion(p, cambiosDoc, updates);
            limpiarEspecificacionStock(p, cambiosDoc, updates);

            if (!cambiosDoc.isEmpty()) {
                detalle.add(cambiosDoc);
                totalCambios += cambiosDoc.size();
                if (!dryRun) {
                    try {
                        repository.actualizar(p.getId(), updates);
                    } catch (Exception e) {
                        log.error("Normalizacion: error actualizando id={}", p.getId(), e);
                        errores++;
                    }
                }
            }
        }
        return new ResultadoNormalizacion(todos.size(), totalCambios, errores, detalle);
    }

    private void normalizarTipo(PerifericoManual p, List<CambioDoc> cambios, Map<String, Object> updates) {
        String tipoOriginal = p.getTipo();
        if (tipoOriginal == null || tipoOriginal.isBlank()) return;

        String tipoNorm = tipoOriginal.trim().toLowerCase(Locale.ROOT);

        if (TIPOS_CANONICOS.contains(tipoNorm)) {
            if (!tipoNorm.equals(tipoOriginal)) {
                cambios.add(new CambioDoc(p.getId(), "tipo", tipoOriginal, tipoNorm));
                updates.put("tipo", tipoNorm);
            }
            return;
        }

        String mapeado = ALIAS_TIPO.get(tipoNorm);
        if (mapeado != null) {
            cambios.add(new CambioDoc(p.getId(), "tipo", tipoOriginal, mapeado));
            updates.put("tipo", mapeado);
        } else {
            cambios.add(new CambioDoc(p.getId(), "tipo", tipoOriginal, "otro (no mapeado)"));
            updates.put("tipo", "otro");
        }
    }

    private void normalizarUbicacion(PerifericoManual p, List<CambioDoc> cambios, Map<String, Object> updates) {
        String ubicOriginal = p.getUbicacion();
        String norm = ubicOriginal == null ? "" : ubicOriginal.trim().toLowerCase(Locale.ROOT);

        if (UBICACIONES_DEPOSITO.contains(norm) || norm.isEmpty()) {
            String nueva = "DEPOSITO";
            if (!nueva.equals(ubicOriginal)) {
                cambios.add(new CambioDoc(p.getId(), "ubicacion", ubicOriginal, nueva));
                updates.put("ubicacion", nueva);
            }
        } else {
            String upper = ubicOriginal.trim().toUpperCase(Locale.ROOT);
            if (!upper.equals(ubicOriginal)) {
                cambios.add(new CambioDoc(p.getId(), "ubicacion", ubicOriginal, upper));
                updates.put("ubicacion", upper);
            }
        }
    }

    private void normalizarMarcaModelo(PerifericoManual p, List<CambioDoc> cambios, Map<String, Object> updates) {
        String nombre = blanco(p.getNombre());
        String fabricante = blanco(p.getFabricante());

        if (!fabricante.isEmpty() && !nombre.isEmpty()) return;

        if (fabricante.isEmpty() && !nombre.isEmpty()) {
            cambios.add(new CambioDoc(p.getId(), "fabricante", p.getFabricante(), nombre));
            updates.put("fabricante", nombre);
        }
    }

    private void normalizarCondicion(PerifericoManual p, List<CambioDoc> cambios, Map<String, Object> updates) {
        if (p.getCondicion() != null && !p.getCondicion().isBlank()) return;

        if (p.getEspecificacionStock() != null && p.getEspecificacionStock().getCondicion() != null
                && !p.getEspecificacionStock().getCondicion().isBlank()) {
            String cond = p.getEspecificacionStock().getCondicion().trim().toUpperCase(Locale.ROOT);
            cambios.add(new CambioDoc(p.getId(), "condicion", null, cond));
            updates.put("condicion", cond);
        }
    }

    private void limpiarEspecificacionStock(PerifericoManual p, List<CambioDoc> cambios, Map<String, Object> updates) {
        if (p.getEspecificacionStock() == null) return;
        String tipoNorm = p.getTipo() == null ? "" : p.getTipo().trim().toLowerCase(Locale.ROOT);
        boolean esPc = "computadora".equals(tipoNorm) || "pc".equals(tipoNorm)
                || "desktop".equals(tipoNorm) || "notebook".equals(tipoNorm);

        if (!esPc) {
            String cpuModelo = p.getEspecificacionStock().getCpuModelo();
            if (cpuModelo != null && !cpuModelo.isBlank()) {
                cambios.add(new CambioDoc(p.getId(), "especificacion_stock.cpu_modelo", cpuModelo, "(limpiar - no es PC)"));
                updates.put("especificacion_stock.cpu_modelo", "");
            }
        }
    }

    private static String blanco(String v) {
        return v == null ? "" : v.trim();
    }
}
