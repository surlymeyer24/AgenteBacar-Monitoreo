package com.bacarsa.inventario.historial;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.bacarsa.inventario.models.EstadoOperativo;
import com.google.cloud.Timestamp;

class ComputadoraHistorialReglasTest {

    private static final ActorHistorial MARIA = new ActorHistorial("uid-maria", "María");
    private static final Timestamp AHORA = Timestamp.ofTimeSecondsAndNanos(1_700_000_000L, 0);
    private static final Timestamp DESPUES = Timestamp.ofTimeSecondsAndNanos(1_700_000_100L, 0);
    private static final Timestamp MAS_TARDE = Timestamp.ofTimeSecondsAndNanos(1_700_000_200L, 0);
    private static final Timestamp AUN_MAS = Timestamp.ofTimeSecondsAndNanos(1_700_000_300L, 0);

    @Test
    void altaManualDejaUnSoloRenglonConUsuarioYEstadoInicial() {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("hostname", "pc-stock");
        cuerpo.put("ubicacion", "SISTEMAS");
        EscrituraHistorial esc = ComputadoraHistorialReglas.altaManual(
                "uuid-1", cuerpo, "Alta de equipo", MARIA, AHORA);

        assertEquals(EscrituraHistorial.Modo.CREAR_CON_HISTORIAL, esc.modo());
        assertEquals("STOCK", esc.campos().get("origen_alta"));
        @SuppressWarnings("unchecked")
        Map<String, Object> estado = (Map<String, Object>) esc.campos().get("estadoActual");
        assertEquals(EstadoOperativo.SIN_ASIGNAR.getNombre(), estado.get("nombre"));

        List<Map<String, Object>> historial = historial(esc);
        assertEquals(1, historial.size());
        Map<String, Object> alta = historial.get(0);
        assertEquals("ALTA_MANUAL", alta.get("tipo"));
        assertEquals("MANUAL", alta.get("origen"));
        assertEquals("SIN_ASIGNAR", alta.get("estado"));
        assertEquals("uid-maria", alta.get("quien_uid"));
        assertEquals("María", alta.get("quien_nombre"));
        assertEquals(AHORA, alta.get("cuando"));
        assertFalse(alta.containsKey("cambios"));
    }

    @Test
    void primerReporteCreaAltaAutomaticaYElSegundoNoLaDuplica() {
        Map<String, Object> reporte = new LinkedHashMap<>();
        reporte.put("uuid", "uuid-agente");
        reporte.put("hostname", "pc-agente");
        reporte.put("ultima_sincronizacion", AHORA);

        EscrituraHistorial alta = ComputadoraHistorialReglas.reporteAgente(null, reporte, AHORA);
        assertEquals(EscrituraHistorial.Modo.CREAR_CON_HISTORIAL, alta.modo());
        assertEquals("DETECTADA_POR_AGENTE", alta.campos().get("origen_alta"));
        List<Map<String, Object>> historial = historial(alta);
        assertEquals(1, historial.size());
        assertEquals("ALTA_AUTOMATICA", historial.get(0).get("tipo"));
        assertEquals("SISTEMA", historial.get(0).get("quien_uid"));
        assertEquals("AGENTE", historial.get(0).get("origen"));
        assertEquals("SIN_ASIGNAR", historial.get(0).get("estado"));
        assertEquals(AHORA, historial.get(0).get("cuando"));

        Map<String, Object> doc = new HashMap<>(alta.campos());
        Map<String, Object> segundo = new LinkedHashMap<>();
        segundo.put("uuid", "uuid-agente");
        segundo.put("ultima_sincronizacion", DESPUES);
        segundo.put("cpu_uso_porcentaje", 40);
        EscrituraHistorial siguiente = ComputadoraHistorialReglas.reporteAgente(doc, segundo, DESPUES);

        assertEquals(EscrituraHistorial.Modo.SOLO_CAMPOS_AGENTE, siguiente.modo());
        assertFalse(siguiente.campos().containsKey("historial"));
        assertEquals(DESPUES, siguiente.campos().get("ultima_sincronizacion"));
        assertEquals(1, historial(doc).size());
    }

    @Test
    void unGuardadoDeTresCamposDejaUnSoloRenglonFicha() {
        Map<String, Object> doc = docConAlta();
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("ubicacion", "TESORERIA");
        cuerpo.put("responsableInventario", "Luis");
        cuerpo.put("serialEquipo", "SN-9");
        cuerpo.put("hostname", "pc-stock");
        cuerpo.put("usuarioActual", "windows");
        cuerpo.put("ultimaSincronizacion", "no-entra");

        EscrituraHistorial esc = ComputadoraHistorialReglas.editarFicha(doc, cuerpo, MARIA, DESPUES);
        List<Map<String, Object>> historial = historial(esc);
        assertEquals(2, historial.size());
        Map<String, Object> ficha = historial.get(1);
        assertEquals("FICHA", ficha.get("tipo"));
        assertEquals("MANUAL", ficha.get("origen"));
        assertEquals(DESPUES, ficha.get("cuando"));
        assertEquals("María", ficha.get("quien_nombre"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cambios = (List<Map<String, Object>>) ficha.get("cambios");
        assertEquals(3, cambios.size());
        assertEquals("ubicacion", cambios.get(0).get("campo"));
        assertEquals("SISTEMAS", cambios.get(0).get("valor_anterior"));
        assertEquals("TESORERIA", cambios.get(0).get("valor_nuevo"));
        assertEquals("responsable", cambios.get(1).get("campo"));
        assertNull(cambios.get(1).get("valor_anterior"));
        assertEquals("Luis", cambios.get(1).get("valor_nuevo"));
        assertEquals("serie", cambios.get(2).get("campo"));
        assertEquals("SN-9", cambios.get(2).get("valor_nuevo"));
    }

    @Test
    void recorridoDeEstadosCierraTramosYLaBajaNoBorraLaFicha() {
        Map<String, Object> doc = docConAlta();
        doc = aplicar(doc, ComputadoraHistorialReglas.cambiarEstado(
                doc, "ASIGNADA", "Asignación", Map.of("responsableInventario", "Luis"), MARIA, DESPUES));
        doc = aplicar(doc, ComputadoraHistorialReglas.cambiarEstado(
                doc, "EN_MANTENIMIENTO", "Se rompió el disco", Map.of(), MARIA, MAS_TARDE));
        EscrituraHistorial baja = ComputadoraHistorialReglas.cambiarEstado(
                doc, "BAJA", "Fin de vida", Map.of(), MARIA, AUN_MAS);
        assertEquals(EscrituraHistorial.Modo.ACTUALIZAR_CON_HISTORIAL, baja.modo());
        doc = aplicar(doc, baja);

        List<Map<String, Object>> estados = historial(doc).stream()
                .filter(r -> "ESTADO".equals(r.get("tipo")))
                .toList();
        assertEquals(3, estados.size());
        assertEquals("ASIGNADA", estados.get(0).get("estado"));
        assertEquals("SIN_ASIGNAR", estados.get(0).get("estado_anterior"));
        assertEquals(MAS_TARDE, estados.get(0).get("hasta"));
        assertEquals("EN_MANTENIMIENTO", estados.get(1).get("estado"));
        assertEquals(AUN_MAS, estados.get(1).get("hasta"));
        assertEquals("BAJA", estados.get(2).get("estado"));
        assertNull(estados.get(2).get("hasta"));
        assertEquals("Fin de vida", estados.get(2).get("motivo"));
        assertEquals("uid-maria", estados.get(2).get("quien_uid"));
        assertEquals("uuid-1", doc.get("uuid"));

        String actoAsignacion = String.valueOf(historial(doc).get(1).get("acto_id"));
        assertEquals(actoAsignacion, historial(doc).get(2).get("acto_id"));
        assertEquals("FICHA", historial(doc).get(2).get("tipo"));
    }

    @Test
    void migracionCopiaTramosSinInventarAutorYEsRepetible() {
        Timestamp viejo = Timestamp.ofTimeSecondsAndNanos(1_600_000_000L, 0);
        Map<String, Object> tramo = new LinkedHashMap<>();
        tramo.put("fechaHoraInicio", viejo);
        tramo.put("fechaHoraFin", DESPUES);
        tramo.put("motivo", "Estaba asignada");
        tramo.put("estado", Map.of("nombre", "Asignada"));

        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("uuid", "vieja");
        doc.put("estadoActual", Map.of("nombre", "Asignada"));
        doc.put("historialEstados", List.of(tramo));

        EscrituraHistorial migrada = ComputadoraHistorialReglas.migrar(doc, AHORA);
        List<Map<String, Object>> historial = historial(migrada);
        assertEquals(1, historial.size());
        assertEquals("ESTADO", historial.get(0).get("tipo"));
        assertEquals("MIGRACION", historial.get(0).get("origen"));
        assertEquals(viejo, historial.get(0).get("desde"));
        assertEquals(DESPUES, historial.get(0).get("hasta"));
        assertEquals("Asignada", historial.get(0).get("estado"));
        assertEquals("DESCONOCIDO", historial.get(0).get("quien_uid"));
        assertFalse(AHORA.equals(historial.get(0).get("desde")));

        Map<String, Object> aplicada = aplicar(doc, migrada);
        assertEquals(EscrituraHistorial.Modo.NADA, ComputadoraHistorialReglas.migrar(aplicada, MAS_TARDE).modo());
    }

    @Test
    void sinHistorialViejoQuedaSoloMigracionInicial() {
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("uuid", "sin-pasado");
        doc.put("estadoActual", Map.of("nombre", "Sin Asignar"));

        EscrituraHistorial esc = ComputadoraHistorialReglas.migrar(doc, AHORA);
        List<Map<String, Object>> historial = historial(esc);
        assertEquals(1, historial.size());
        assertEquals("MIGRACION_INICIAL", historial.get(0).get("tipo"));
        assertEquals("MIGRACION", historial.get(0).get("origen"));
        assertEquals("SISTEMA", historial.get(0).get("quien_uid"));
        assertEquals(Boolean.TRUE, historial.get(0).get("pasado_desconocido"));
        assertEquals(AHORA, historial.get(0).get("cuando"));
        assertEquals("Sin Asignar", historial.get(0).get("estado"));
    }

    @Test
    void cambioDeEstadoSinMotivoNoArmaEscritura() {
        Map<String, Object> doc = docConAlta();
        assertThrows(IllegalArgumentException.class, () -> ComputadoraHistorialReglas.cambiarEstado(
                doc, "BAJA", "  ", Map.of(), MARIA, AHORA));
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> historial(EscrituraHistorial esc) {
        return (List<Map<String, Object>>) esc.campos().get("historial");
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> historial(Map<String, Object> doc) {
        return (List<Map<String, Object>>) doc.get("historial");
    }

    private static Map<String, Object> docConAlta() {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("hostname", "pc-stock");
        cuerpo.put("ubicacion", "SISTEMAS");
        return new HashMap<>(ComputadoraHistorialReglas.altaManual(
                "uuid-1", cuerpo, null, MARIA, AHORA).campos());
    }

    private static Map<String, Object> aplicar(Map<String, Object> doc, EscrituraHistorial esc) {
        Map<String, Object> siguiente = new HashMap<>(doc);
        for (Map.Entry<String, Object> entry : esc.campos().entrySet()) {
            if (entry.getValue() == null) {
                siguiente.remove(entry.getKey());
            } else if (entry.getValue() instanceof List<?> lista) {
                siguiente.put(entry.getKey(), new ArrayList<>(lista));
            } else {
                siguiente.put(entry.getKey(), entry.getValue());
            }
        }
        return siguiente;
    }
}
