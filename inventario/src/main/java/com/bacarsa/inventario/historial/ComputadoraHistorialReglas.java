package com.bacarsa.inventario.historial;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.OrigenAlta;
import com.google.cloud.Timestamp;

/**
 * Reglas puras del historial de una PC. No escribe en Firestore.
 * La fecha y el actor los recibe ya resueltos por el servidor.
 */
public final class ComputadoraHistorialReglas {

    public static final String HISTORIAL = "historial";
    public static final String HISTORIAL_MIGRADO = "historial_migrado";

    private static final Set<String> CAMPOS_FICHA = Set.of(
            "hostname",
            "ubicacion",
            "responsable",
            "serie",
            "anydesk",
            "notas",
            "tipo_equipo",
            "condicion",
            "sistema_operativo",
            "arquitectura",
            "ubicacion_stock");

    /** Claves de API que una persona puede mandar en un guardado de ficha. */
    private static final Map<String, String> API_A_CAMPO = Map.ofEntries(
            Map.entry("hostname", "hostname"),
            Map.entry("ubicacion", "ubicacion"),
            Map.entry("responsableInventario", "responsable"),
            Map.entry("serialEquipo", "serie"),
            Map.entry("anydeskId", "anydesk"),
            Map.entry("notas", "notas"),
            Map.entry("tipoEquipo", "tipo_equipo"),
            Map.entry("condicion", "condicion"),
            Map.entry("sistemaOperativo", "sistema_operativo"),
            Map.entry("arquitectura", "arquitectura"),
            Map.entry("ubicacionStock", "ubicacion_stock"));

    private static final Set<String> CAMPOS_AGENTE = Set.of(
            "ultima_sincronizacion",
            "estado_conexion",
            "cpu_uso_porcentaje",
            "ram_uso_porcentaje",
            "ram_total_gb",
            "perifericos",
            "discos",
            "modulos_ram",
            "procesador",
            "nucleos_fisicos",
            "procesador_detallado",
            "ram_placa",
            "windows_version_detallada",
            "usuarios",
            "sistema_operativo",
            "arquitectura");

    private ComputadoraHistorialReglas() {
    }

    public static EscrituraHistorial altaManual(String uuid, Map<String, Object> cuerpo,
            String motivo, ActorHistorial actor, Timestamp ahora) {
        if (uuid == null || uuid.isBlank()) {
            throw new IllegalArgumentException("El uuid es obligatorio");
        }
        String hostname = texto(cuerpo == null ? null : cuerpo.get("hostname"));
        if (hostname == null) {
            throw new IllegalArgumentException("El hostname es obligatorio");
        }

        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("uuid", uuid.trim());
        doc.put("hostname", hostname);
        ponerSiTexto(doc, "ubicacion", cuerpo.get("ubicacion"));
        ponerSiTexto(doc, "sistema_operativo", cuerpo.get("sistemaOperativo"));
        ponerSiTexto(doc, "arquitectura", cuerpo.get("arquitectura"));
        ponerSiTexto(doc, "condicion", cuerpo.get("condicion"));
        ponerSiTexto(doc, "serial_equipo", cuerpo.get("serialEquipo"));
        ponerSiTexto(doc, "anydesk_id", cuerpo.get("anydeskId"));
        ponerSiTexto(doc, "notas", cuerpo.get("notas"));
        String tipo = texto(cuerpo.get("tipoEquipo"));
        if (tipo != null) {
            doc.put("tipo_equipo", Map.of("tipo", tipo));
        }
        String usuario = texto(cuerpo.get("usuarioActual"));
        if (usuario != null) {
            doc.put("usuarios", Map.of("usuario_actual", usuario));
        }

        doc.put("origen_alta", OrigenAlta.STOCK.name());
        doc.put("estado_conciliacion", "SIN_BASELINE");
        doc.put("estadoActual", mapaEstado(EstadoOperativo.SIN_ASIGNAR));
        doc.put(HISTORIAL_MIGRADO, true);

        Map<String, Object> alta = baseActor(actor, ahora);
        alta.put("tipo", "ALTA_MANUAL");
        alta.put("origen", "MANUAL");
        alta.put("estado", EstadoOperativo.SIN_ASIGNAR.name());
        String motivoLimpio = texto(motivo);
        if (motivoLimpio != null) {
            alta.put("motivo", motivoLimpio);
        }
        doc.put(HISTORIAL, List.of(alta));
        return EscrituraHistorial.crearConHistorial(doc);
    }

    /**
     * Primer reporte con uuid nuevo: crea la ficha y ALTA_AUTOMATICA.
     * El mismo uuid después solo pisa campos del agente.
     */
    public static EscrituraHistorial reporteAgente(Map<String, Object> docExistente,
            Map<String, Object> camposAgente, Timestamp ahora) {
        Map<String, Object> agente = camposAgente == null ? Map.of() : camposAgente;
        if (docExistente == null) {
            String uuid = texto(agente.get("uuid"));
            if (uuid == null) {
                throw new IllegalArgumentException("El reporte no tiene uuid");
            }
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("uuid", uuid);
            String hostname = texto(agente.get("hostname"));
            if (hostname != null) {
                doc.put("hostname", hostname);
            }
            aplicarAgente(doc, agente, true);
            doc.put("origen_alta", OrigenAlta.DETECTADA_POR_AGENTE.name());
            doc.put("estado_conciliacion", "SIN_BASELINE");
            doc.put("estadoActual", mapaEstado(EstadoOperativo.SIN_ASIGNAR));
            if (!doc.containsKey("ultima_sincronizacion")) {
                doc.put("ultima_sincronizacion", ahora);
            }
            doc.put("primer_reporte_agente_at", ahora);
            doc.put(HISTORIAL_MIGRADO, true);
            doc.put(HISTORIAL, List.of(renglonAltaAutomatica(ahora)));
            return EscrituraHistorial.crearConHistorial(doc);
        }

        List<Map<String, Object>> historial = copiarHistorial(docExistente.get(HISTORIAL));
        Map<String, Object> updates = new LinkedHashMap<>();
        boolean altaNueva = false;
        if (correspondeAltaAutomatica(docExistente, historial)) {
            historial.add(renglonAltaAutomatica(ahora));
            updates.put(HISTORIAL, historial);
            updates.put(HISTORIAL_MIGRADO, true);
            if (leerEstadoNombre(docExistente) == null) {
                updates.put("estadoActual", mapaEstado(EstadoOperativo.SIN_ASIGNAR));
            }
            if (texto(docExistente.get("origen_alta")) == null) {
                updates.put("origen_alta", OrigenAlta.DETECTADA_POR_AGENTE.name());
            }
            if (docExistente.get("primer_reporte_agente_at") == null) {
                updates.put("primer_reporte_agente_at", ahora);
            }
            altaNueva = true;
        }

        Map<String, Object> agenteUpdates = new LinkedHashMap<>();
        aplicarAgente(agenteUpdates, agente, false);
        quitarIguales(docExistente, agenteUpdates);
        updates.putAll(agenteUpdates);

        if (altaNueva) {
            return EscrituraHistorial.actualizarConHistorial(updates);
        }
        if (agenteUpdates.isEmpty()) {
            return EscrituraHistorial.nada();
        }
        return EscrituraHistorial.soloCamposAgente(agenteUpdates);
    }

    public static EscrituraHistorial editarFicha(Map<String, Object> doc, Map<String, Object> cuerpo,
            ActorHistorial actor, Timestamp ahora) {
        if (doc == null) {
            throw new IllegalArgumentException("Documento no encontrado");
        }
        List<Map<String, Object>> cambios = diffFicha(doc, normalizarCuerpoFicha(cuerpo));
        if (cambios.isEmpty()) {
            return EscrituraHistorial.nada();
        }
        Map<String, Object> updates = aplicarCambiosFicha(doc, cambios);
        List<Map<String, Object>> historial = copiarHistorial(doc.get(HISTORIAL));
        historial.add(renglonFicha(actor, ahora, nuevoActo(), "MANUAL", cambios));
        updates.put(HISTORIAL, historial);
        return EscrituraHistorial.actualizarConHistorial(updates);
    }

    public static EscrituraHistorial cambiarEstado(Map<String, Object> doc, String estadoPedido,
            String motivo, Map<String, Object> fichaEnElMismoActo, ActorHistorial actor, Timestamp ahora) {
        if (doc == null) {
            throw new IllegalArgumentException("Documento no encontrado");
        }
        String motivoLimpio = texto(motivo);
        if (motivoLimpio == null) {
            throw new IllegalArgumentException("El motivo es obligatorio en el cambio de estado");
        }
        String nuevo = resolverEstado(doc, estadoPedido);
        String anterior = enumOTexto(leerEstadoNombre(doc));

        Map<String, String> ficha = normalizarCuerpoFicha(
                fichaEnElMismoActo == null ? Map.of() : fichaEnElMismoActo);
        if (EstadoOperativo.SIN_ASIGNAR.name().equals(nuevo) && !ficha.containsKey("responsable")) {
            ficha.put("responsable", null);
        }
        List<Map<String, Object>> cambiosFicha = diffFicha(doc, ficha);
        boolean cambiaEstado = anterior == null || !anterior.equals(nuevo);
        if (!cambiaEstado && cambiosFicha.isEmpty()) {
            throw new IllegalArgumentException("El estado no cambió");
        }

        String acto = nuevoActo();
        List<Map<String, Object>> historial = copiarHistorial(doc.get(HISTORIAL));
        Map<String, Object> updates = new LinkedHashMap<>();
        if (cambiaEstado) {
            cerrarTramoVigente(historial, ahora);
            Map<String, Object> tramo = baseActor(actor, null);
            tramo.put("tipo", "ESTADO");
            tramo.put("acto_id", acto);
            tramo.put("desde", ahora);
            tramo.put("hasta", null);
            tramo.put("estado", nuevo);
            if (anterior != null) {
                tramo.put("estado_anterior", anterior);
            }
            tramo.put("motivo", motivoLimpio);
            tramo.put("origen", "MANUAL");
            historial.add(tramo);
            EstadoOperativo op = EstadoOperativo.valueOf(nuevo);
            updates.put("estadoActual", mapaEstado(op));
            if (op != EstadoOperativo.SIN_ASIGNAR && !ficha.containsKey("ubicacion_stock")) {
                updates.put("ubicacion_stock", null);
                String stockActual = leerCampo(doc, "ubicacion_stock");
                if (stockActual != null) {
                    cambiosFicha = new ArrayList<>(cambiosFicha);
                    cambiosFicha.add(cambio("ubicacion_stock", stockActual, null));
                }
            }
        }
        if (!cambiosFicha.isEmpty()) {
            updates.putAll(aplicarCambiosFicha(doc, cambiosFicha));
            historial.add(renglonFicha(actor, ahora, acto, "MANUAL", cambiosFicha));
        }
        updates.put(HISTORIAL, historial);
        return EscrituraHistorial.actualizarConHistorial(updates);
    }

    public static EscrituraHistorial migrar(Map<String, Object> doc, Timestamp ahora) {
        if (doc == null) {
            throw new IllegalArgumentException("Documento no encontrado");
        }
        if (Boolean.TRUE.equals(doc.get(HISTORIAL_MIGRADO))) {
            return EscrituraHistorial.nada();
        }
        List<Map<String, Object>> historial = copiarHistorial(doc.get(HISTORIAL));
        if (yaTieneMigracion(historial)) {
            return EscrituraHistorial.soloMarca(Map.of(HISTORIAL_MIGRADO, true));
        }
        if (tieneAlta(historial)) {
            return EscrituraHistorial.soloMarca(Map.of(HISTORIAL_MIGRADO, true));
        }

        List<Map<String, Object>> copiados = copiarTramosViejos(doc.get("historialEstados"));
        Map<String, Object> updates = new LinkedHashMap<>();
        updates.put(HISTORIAL_MIGRADO, true);
        if (!copiados.isEmpty()) {
            copiados.addAll(historial);
            updates.put(HISTORIAL, copiados);
            return EscrituraHistorial.actualizarConHistorial(updates);
        }

        Map<String, Object> inicial = baseActor(ActorHistorial.SISTEMA, ahora);
        inicial.put("tipo", "MIGRACION_INICIAL");
        inicial.put("origen", "MIGRACION");
        inicial.put("pasado_desconocido", true);
        String vigente = leerEstadoNombre(doc);
        if (vigente != null) {
            inicial.put("estado", vigente);
        }
        historial.add(inicial);
        updates.put(HISTORIAL, historial);
        return EscrituraHistorial.actualizarConHistorial(updates);
    }

    static Map<String, String> normalizarCuerpoFicha(Map<String, Object> cuerpo) {
        Map<String, String> out = new LinkedHashMap<>();
        if (cuerpo == null) {
            return out;
        }
        for (Map.Entry<String, Object> e : cuerpo.entrySet()) {
            String campo = API_A_CAMPO.get(e.getKey());
            if (campo == null && CAMPOS_FICHA.contains(e.getKey())) {
                campo = e.getKey();
            }
            if (campo == null) {
                continue;
            }
            out.put(campo, texto(e.getValue()));
        }
        return out;
    }

    private static List<Map<String, Object>> diffFicha(Map<String, Object> doc, Map<String, String> nuevos) {
        List<Map<String, Object>> cambios = new ArrayList<>();
        for (Map.Entry<String, String> e : nuevos.entrySet()) {
            String antes = leerCampo(doc, e.getKey());
            String despues = e.getValue();
            if (igual(antes, despues)) {
                continue;
            }
            cambios.add(cambio(e.getKey(), antes, despues));
        }
        return cambios;
    }

    private static Map<String, Object> aplicarCambiosFicha(Map<String, Object> doc,
            List<Map<String, Object>> cambios) {
        Map<String, Object> updates = new LinkedHashMap<>();
        for (Map<String, Object> cambio : cambios) {
            String campo = String.valueOf(cambio.get("campo"));
            String nuevo = texto(cambio.get("valor_nuevo"));
            switch (campo) {
                case "hostname" -> updates.put("hostname", nuevo);
                case "ubicacion" -> updates.put("ubicacion", nuevo);
                case "responsable" -> updates.put("responsable_inventario", nuevo);
                case "serie" -> updates.put("serial_equipo", nuevo);
                case "anydesk" -> updates.put("anydesk_id", nuevo);
                case "notas" -> updates.put("notas", nuevo);
                case "condicion" -> updates.put("condicion", nuevo);
                case "sistema_operativo" -> updates.put("sistema_operativo", nuevo);
                case "arquitectura" -> updates.put("arquitectura", nuevo);
                case "ubicacion_stock" -> updates.put("ubicacion_stock", nuevo);
                case "tipo_equipo" -> {
                    if (nuevo == null) {
                        updates.put("tipo_equipo", null);
                    } else {
                        Map<String, Object> te = new LinkedHashMap<>();
                        te.put("tipo", nuevo);
                        Object existente = doc.get("tipo_equipo");
                        if (existente instanceof Map<?, ?> mapa && mapa.get("tiene_bateria") != null) {
                            te.put("tiene_bateria", mapa.get("tiene_bateria"));
                        }
                        updates.put("tipo_equipo", te);
                    }
                }
                default -> {
                    // campo fuera de la lista cerrada: no se escribe
                }
            }
        }
        return updates;
    }

    private static boolean correspondeAltaAutomatica(Map<String, Object> doc,
            List<Map<String, Object>> historial) {
        if (tieneAlta(historial) || yaTieneMigracion(historial)) {
            return false;
        }
        if (Boolean.TRUE.equals(doc.get(HISTORIAL_MIGRADO))) {
            return false;
        }
        if (tieneHistorialEstados(doc.get("historialEstados"))) {
            return false;
        }
        String origen = texto(doc.get("origen_alta"));
        if (origen == null || OrigenAlta.DETECTADA_POR_AGENTE.name().equals(origen)) {
            return doc.get("ultima_sincronizacion") != null;
        }
        return false;
    }

    private static Map<String, Object> renglonAltaAutomatica(Timestamp ahora) {
        Map<String, Object> alta = baseActor(ActorHistorial.SISTEMA, ahora);
        alta.put("tipo", "ALTA_AUTOMATICA");
        alta.put("origen", "AGENTE");
        alta.put("estado", EstadoOperativo.SIN_ASIGNAR.name());
        return alta;
    }

    private static Map<String, Object> renglonFicha(ActorHistorial actor, Timestamp ahora, String acto,
            String origen, List<Map<String, Object>> cambios) {
        Map<String, Object> row = baseActor(actor, ahora);
        row.put("tipo", "FICHA");
        row.put("acto_id", acto);
        row.put("origen", origen);
        row.put("cambios", cambios);
        return row;
    }

    private static Map<String, Object> cambio(String campo, String antes, String despues) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("campo", campo);
        c.put("valor_anterior", antes);
        c.put("valor_nuevo", despues);
        return c;
    }

    private static void cerrarTramoVigente(List<Map<String, Object>> historial, Timestamp ahora) {
        for (int i = 0; i < historial.size(); i++) {
            Map<String, Object> row = historial.get(i);
            if (!"ESTADO".equals(row.get("tipo")) || row.get("hasta") != null) {
                continue;
            }
            Map<String, Object> copia = new LinkedHashMap<>(row);
            copia.put("hasta", ahora);
            historial.set(i, copia);
        }
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarTramosViejos(Object raw) {
        if (!(raw instanceof List<?> lista) || lista.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        String estadoPrevio = null;
        for (Object item : lista) {
            if (!(item instanceof Map<?, ?> mapa)) {
                continue;
            }
            Object desde = primero(mapa, "fechaHoraInicio", "fecha_hora_inicio", "desde");
            if (desde == null) {
                continue;
            }
            String estado = leerEstadoDeTramo(mapa.get("estado"));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("tipo", "ESTADO");
            row.put("origen", "MIGRACION");
            row.put("desde", desde);
            row.put("hasta", primero(mapa, "fechaHoraFin", "fecha_hora_fin", "hasta"));
            if (estado != null) {
                row.put("estado", estado);
            }
            if (estadoPrevio != null) {
                row.put("estado_anterior", estadoPrevio);
            }
            String motivo = texto(mapa.get("motivo"));
            if (motivo != null) {
                row.put("motivo", motivo);
            }
            ActorHistorial quien = actorDelTramoViejo(mapa);
            row.put("quien_uid", quien.uid());
            row.put("quien_nombre", quien.nombre());
            String origenPrevio = texto(primero(mapa, "origen_cambio", "origen"));
            if (origenPrevio != null) {
                row.put("origen_previo", origenPrevio);
            }
            out.add(row);
            if (estado != null) {
                estadoPrevio = estado;
            }
        }
        return out;
    }

    private static ActorHistorial actorDelTramoViejo(Map<?, ?> mapa) {
        String uid = texto(primero(mapa, "quien_uid", "uid", "autor_uid"));
        String nombre = texto(primero(mapa, "quien_nombre", "autor", "usuario"));
        if (uid == null && nombre == null) {
            return ActorHistorial.DESCONOCIDO;
        }
        return new ActorHistorial(
                uid == null ? ActorHistorial.DESCONOCIDO.uid() : uid,
                nombre == null ? ActorHistorial.DESCONOCIDO.nombre() : nombre);
    }

    private static String leerEstadoDeTramo(Object estado) {
        if (estado instanceof Map<?, ?> mapa) {
            return texto(mapa.get("nombre") != null ? mapa.get("nombre") : mapa.get("estado"));
        }
        return texto(estado);
    }

    private static boolean tieneAlta(List<Map<String, Object>> historial) {
        for (Map<String, Object> row : historial) {
            Object tipo = row.get("tipo");
            if ("ALTA_MANUAL".equals(tipo) || "ALTA_AUTOMATICA".equals(tipo)) {
                return true;
            }
        }
        return false;
    }

    private static boolean yaTieneMigracion(List<Map<String, Object>> historial) {
        for (Map<String, Object> row : historial) {
            if ("MIGRACION_INICIAL".equals(row.get("tipo")) || "MIGRACION".equals(row.get("origen"))) {
                return true;
            }
        }
        return false;
    }

    private static boolean tieneHistorialEstados(Object raw) {
        return raw instanceof List<?> lista && !lista.isEmpty();
    }

    private static String resolverEstado(Map<String, Object> doc, String estadoPedido) {
        String trimmed = estadoPedido == null ? "" : estadoPedido.trim();
        if ("DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            String responsable = leerCampo(doc, "responsable");
            return EstadoOperativo.inferirAsignacionDesdeTexto(responsable).name();
        }
        try {
            return EstadoOperativo.valueOf(trimmed).name();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estadoPedido, ex);
        }
    }

    private static String enumOTexto(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return EstadoOperativo.valueOf(raw.trim()).name();
        } catch (IllegalArgumentException ignored) {
            for (EstadoOperativo op : EstadoOperativo.values()) {
                if (op.getNombre().equalsIgnoreCase(raw.trim())) {
                    return op.name();
                }
            }
            return raw.trim();
        }
    }

    @SuppressWarnings("unchecked")
    private static String leerEstadoNombre(Map<String, Object> doc) {
        Object actual = doc.get("estadoActual");
        if (actual instanceof Map<?, ?> mapa) {
            String nombre = texto(mapa.get("nombre"));
            if (nombre != null) {
                return nombre;
            }
        }
        return texto(actual);
    }

    static String leerCampo(Map<String, Object> doc, String campo) {
        return switch (campo) {
            case "hostname" -> texto(doc.get("hostname"));
            case "ubicacion" -> texto(doc.get("ubicacion"));
            case "responsable" -> texto(doc.get("responsable_inventario"));
            case "serie" -> texto(doc.get("serial_equipo"));
            case "anydesk" -> texto(doc.get("anydesk_id"));
            case "notas" -> texto(doc.get("notas"));
            case "condicion" -> texto(doc.get("condicion"));
            case "sistema_operativo" -> texto(doc.get("sistema_operativo"));
            case "arquitectura" -> texto(doc.get("arquitectura"));
            case "ubicacion_stock" -> texto(doc.get("ubicacion_stock"));
            case "tipo_equipo" -> leerTipo(doc.get("tipo_equipo"));
            default -> null;
        };
    }

    private static String leerTipo(Object raw) {
        if (raw instanceof Map<?, ?> mapa) {
            return texto(mapa.get("tipo"));
        }
        return texto(raw);
    }

    private static void aplicarAgente(Map<String, Object> destino, Map<String, Object> agente, boolean alta) {
        for (String clave : CAMPOS_AGENTE) {
            if (!agente.containsKey(clave) || agente.get(clave) == null) {
                continue;
            }
            if (!alta && ("sistema_operativo".equals(clave) || "arquitectura".equals(clave))) {
                destino.put(clave, agente.get(clave));
                continue;
            }
            destino.put(clave, agente.get(clave));
        }
        if (agente.get("usuarioActual") != null || agente.get("usuario_actual") != null) {
            String usuario = texto(agente.get("usuarioActual") != null
                    ? agente.get("usuarioActual") : agente.get("usuario_actual"));
            if (usuario != null) {
                destino.put("usuarios", Map.of("usuario_actual", usuario));
            }
        }
    }

    private static void quitarIguales(Map<String, Object> doc, Map<String, Object> updates) {
        updates.entrySet().removeIf(e -> igualObjeto(doc.get(e.getKey()), e.getValue()));
    }

    private static boolean igualObjeto(Object a, Object b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        return String.valueOf(a).equals(String.valueOf(b));
    }

    private static Map<String, Object> mapaEstado(EstadoOperativo estado) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("nombre", estado.getNombre());
        mapa.put("descripcion", estado.getDescripcion());
        return mapa;
    }

    private static Map<String, Object> baseActor(ActorHistorial actor, Timestamp cuando) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("acto_id", nuevoActo());
        if (cuando != null) {
            row.put("cuando", cuando);
        }
        row.put("quien_uid", actor.uid());
        row.put("quien_nombre", actor.nombre());
        return row;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> copiarHistorial(Object raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (!(raw instanceof List<?> lista)) {
            return out;
        }
        for (Object item : lista) {
            if (item instanceof Map<?, ?> mapa) {
                out.add(new LinkedHashMap<>((Map<String, Object>) mapa));
            }
        }
        return out;
    }

    private static void ponerSiTexto(Map<String, Object> doc, String clave, Object valor) {
        String texto = texto(valor);
        if (texto != null) {
            doc.put(clave, texto);
        }
    }

    private static Object primero(Map<?, ?> mapa, String... claves) {
        for (String clave : claves) {
            if (mapa.get(clave) != null) {
                return mapa.get(clave);
            }
        }
        return null;
    }

    private static String texto(Object valor) {
        if (valor == null) {
            return null;
        }
        String s = String.valueOf(valor).trim();
        return s.isEmpty() ? null : s;
    }

    private static boolean igual(String a, String b) {
        if (a == null) {
            return b == null;
        }
        return a.equals(b);
    }

    private static String nuevoActo() {
        return UUID.randomUUID().toString();
    }
}
