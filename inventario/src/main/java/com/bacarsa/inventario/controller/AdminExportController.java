package com.bacarsa.inventario.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@RestController
@RequestMapping("/api/admin/export")
public class AdminExportController {

    private final PerifericoManualRepository perifericoManualRepository;
    private final ComputadoraRepository computadoraRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    public AdminExportController(
            PerifericoManualRepository perifericoManualRepository,
            ComputadoraRepository computadoraRepository,
            MovimientoStockRepository movimientoStockRepository) {
        this.perifericoManualRepository = perifericoManualRepository;
        this.computadoraRepository = computadoraRepository;
        this.movimientoStockRepository = movimientoStockRepository;
    }

    @GetMapping("/dump")
    public ResponseEntity<Map<String, Object>> dump(
            @RequestParam(defaultValue = "true") boolean perifericos,
            @RequestParam(defaultValue = "true") boolean computadoras,
            @RequestParam(defaultValue = "true") boolean movimientos)
            throws ExecutionException, InterruptedException {

        Map<String, Object> resultado = new LinkedHashMap<>();

        if (perifericos) {
            resultado.put("perifericos_manuales", exportarPerifericos());
        }
        if (computadoras) {
            resultado.put("computadoras", exportarComputadoras());
        }
        if (movimientos) {
            resultado.put("movimientos_stock", exportarMovimientos());
        }

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/dump/perifericos-manuales")
    public ResponseEntity<List<Map<String, Object>>> dumpPerifericos()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(exportarPerifericos());
    }

    @GetMapping("/dump/computadoras")
    public ResponseEntity<List<Map<String, Object>>> dumpComputadoras()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(exportarComputadoras());
    }

    @GetMapping("/dump/movimientos-stock")
    public ResponseEntity<List<Map<String, Object>>> dumpMovimientos()
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(exportarMovimientos());
    }

    private List<Map<String, Object>> exportarPerifericos() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> lista = new ArrayList<>();
        for (PerifericoManual p : perifericoManualRepository.findAll()) {
            if (p == null) continue;
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", p.getId());
            fila.put("codigo_interno", p.getCodigoInterno());
            fila.put("tipo", p.getTipo());
            fila.put("cantidad", p.getCantidad());
            fila.put("nombre", p.getNombre());
            fila.put("fabricante", p.getFabricante());
            fila.put("conexion", p.getConexion());
            fila.put("computadora_hostname", p.getComputadoraHostname());
            fila.put("computadora_uuid", p.getComputadoraUuid());
            fila.put("ubicacion", p.getUbicacion());
            fila.put("notas", p.getNotas());
            fila.put("fechaAlta", p.getFechaAlta());
            fila.put("comboId", p.getComboId());
            fila.put("comboNombre", p.getComboNombre());
            fila.put("numero_serie", p.getNumeroSerie());
            fila.put("lote_origen_id", p.getLoteOrigenId());
            fila.put("condicion", p.getCondicion());
            fila.put("responsable", p.getResponsable());
            Estado estado = p.getEstadoActual();
            fila.put("estado_nombre", estado != null ? estado.getNombre() : null);
            fila.put("estado_descripcion", estado != null ? estado.getDescripcion() : null);
            fila.put("historial_estados_count", p.getHistorialEstados() != null ? p.getHistorialEstados().size() : 0);
            if (p.getEspecificacionStock() != null) {
                Map<String, Object> spec = new LinkedHashMap<>();
                spec.put("cpu_modelo", nvl(p.getEspecificacionStock().getCpuModelo()));
                spec.put("ram_total_gb", p.getEspecificacionStock().getRamTotalGb());
                spec.put("disco_resumen", nvl(p.getEspecificacionStock().getDiscoResumen()));
                spec.put("tipo_equipo", nvl(p.getEspecificacionStock().getTipoEquipo()));
                spec.put("condicion", nvl(p.getEspecificacionStock().getCondicion()));
                fila.put("especificacion_stock", spec);
            }
            lista.add(fila);
        }
        return lista;
    }

    private List<Map<String, Object>> exportarComputadoras() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> lista = new ArrayList<>();
        for (Computadora c : computadoraRepository.findAll()) {
            if (c == null) continue;
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("uuid", c.getUuid());
            fila.put("codigo_interno", c.getCodigoInterno());
            fila.put("hostname", c.getHostname());
            fila.put("usuario_actual", c.getUsuarioActual());
            fila.put("ubicacion", c.getUbicacion() != null ? c.getUbicacion().name() : null);
            fila.put("tipo_equipo", c.getTipoEquipo() != null ? c.getTipoEquipo().getTipo() : null);
            fila.put("tiene_bateria", c.getTipoEquipo() != null ? c.getTipoEquipo().getTieneBateria() : null);
            fila.put("sistema_operativo", c.getSistemaOperativo());
            fila.put("responsable_inventario", c.getResponsableInventario());
            fila.put("condicion", c.getCondicion());
            fila.put("origen_alta", c.getOrigenAlta() != null ? c.getOrigenAlta().name() : null);
            fila.put("agente_uuid", c.getAgenteUuid());
            fila.put("lote_origen_id", c.getLoteOrigenId());
            fila.put("serial_equipo", c.getSerialEquipo());
            fila.put("anydesk_id", c.getAnydeskId());
            fila.put("estado_conexion", c.getEstadoConexion());
            fila.put("descripcion_stock", c.getDescripcionStock());
            Estado estado = c.getEstadoActual();
            fila.put("estado_nombre", estado != null ? estado.getNombre() : null);
            fila.put("estado_descripcion", estado != null ? estado.getDescripcion() : null);
            fila.put("historial_estados_count", c.getHistorialEstados() != null ? c.getHistorialEstados().size() : 0);
            fila.put("historial_count", c.getHistorial() != null ? c.getHistorial().size() : 0);
            lista.add(fila);
        }
        return lista;
    }

    private List<Map<String, Object>> exportarMovimientos() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> lista = new ArrayList<>();
        for (MovimientoStock m : movimientoStockRepository.findAll()) {
            if (m == null) continue;
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", m.getId());
            fila.put("codigo", m.getCodigo());
            fila.put("tipo", m.getTipo());
            fila.put("marca", m.getMarca());
            fila.put("modelo", m.getModelo());
            fila.put("serie_o_imei", m.getSerieOImei());
            fila.put("responsable", m.getResponsable());
            fila.put("area", m.getArea());
            fila.put("accion", m.getAccion());
            fila.put("estado", m.getEstado());
            fila.put("fecha", m.getFecha());
            fila.put("fecha_devolucion", m.getFechaDevolucion());
            fila.put("motivo", m.getMotivo());
            fila.put("actor_uid", m.getActorUid());
            fila.put("tipo_movimiento", m.getTipoMovimiento());
            fila.put("periferico_id", m.getPerifericoId());
            fila.put("computadora_uuid", m.getComputadoraUuid());
            fila.put("ubicacion_origen", m.getUbicacionOrigen());
            fila.put("ubicacion_destino", m.getUbicacionDestino());
            fila.put("estado_anterior", m.getEstadoAnterior());
            fila.put("estado_nuevo", m.getEstadoNuevo());
            lista.add(fila);
        }
        return lista;
    }

    private static String nvl(String v) {
        return v != null ? v : "";
    }
}
