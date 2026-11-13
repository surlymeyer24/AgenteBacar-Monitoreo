package com.bacarsa.inventario.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MigracionHistorialResultDTO;
import com.bacarsa.inventario.historial.ActorHistorial;
import com.bacarsa.inventario.historial.ComputadoraHistorialReglas;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@Service
public class ComputadoraHistorialService {

    private final ComputadoraRepository computadoraRepository;
    private final UsuarioRepository usuarioRepository;

    public ComputadoraHistorialService(ComputadoraRepository computadoraRepository,
            UsuarioRepository usuarioRepository) {
        this.computadoraRepository = computadoraRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public void altaManual(String uuid, Map<String, Object> cuerpo, String motivo, String uid)
            throws ExecutionException, InterruptedException {
        ActorHistorial actor = actorDe(uid);
        computadoraRepository.aplicarHistorial(uuid, (doc, ahora) -> {
            if (doc != null) {
                throw new IllegalArgumentException("Ya existe una computadora con ese uuid");
            }
            return ComputadoraHistorialReglas.altaManual(uuid, cuerpo, motivo, actor, ahora);
        });
    }

    public void editarFicha(String uuid, Map<String, Object> cuerpo, String uid)
            throws ExecutionException, InterruptedException {
        ActorHistorial actor = actorDe(uid);
        computadoraRepository.aplicarHistorial(uuid,
                (doc, ahora) -> ComputadoraHistorialReglas.editarFicha(doc, cuerpo, actor, ahora));
    }

    public void cambiarEstado(String uuid, String estado, String motivo, Map<String, Object> ficha, String uid)
            throws ExecutionException, InterruptedException {
        ActorHistorial actor = actorDe(uid);
        computadoraRepository.aplicarHistorial(uuid,
                (doc, ahora) -> ComputadoraHistorialReglas.cambiarEstado(doc, estado, motivo, ficha, actor, ahora));
    }

    /**
     * Reporte del agente. Si el uuid no existe, crea la ficha y ALTA_AUTOMATICA.
     * Si existe, no hay segunda alta y los campos del agente no suman renglón.
     */
    public void registrarReporteAgente(Map<String, Object> camposAgente)
            throws ExecutionException, InterruptedException {
        Object uuidRaw = camposAgente == null ? null : camposAgente.get("uuid");
        String uuid = uuidRaw == null ? "" : String.valueOf(uuidRaw).trim();
        if (uuid.isEmpty()) {
            throw new IllegalArgumentException("El reporte no tiene uuid");
        }
        Map<String, Object> campos = traducirReporte(camposAgente);
        computadoraRepository.aplicarHistorial(uuid,
                (doc, ahora) -> ComputadoraHistorialReglas.reporteAgente(doc, campos, ahora));
    }

    /**
     * El documento ya está en Firestore (lo escribió el agente). Agrega ALTA_AUTOMATICA
     * solo si esta ficha todavía no tiene alta ni migración.
     */
    public void registrarLlegadaDeReporte(String uuid) throws ExecutionException, InterruptedException {
        computadoraRepository.aplicarHistorial(uuid,
                (doc, ahora) -> ComputadoraHistorialReglas.reporteAgente(doc, Map.of("uuid", uuid), ahora));
    }

    public MigracionHistorialResultDTO migrarLote(int limite) throws ExecutionException, InterruptedException {
        int tope = Math.min(Math.max(limite, 1), 50);
        List<String> ids = computadoraRepository.listarUuidsSinMigrar(tope);
        MigracionHistorialResultDTO result = new MigracionHistorialResultDTO();
        result.setRevisadas(ids.size());
        for (String uuid : ids) {
            try {
                boolean escribio = migrarUna(uuid);
                if (escribio) {
                    result.setMigradas(result.getMigradas() + 1);
                    result.getMigradasIds().add(uuid);
                } else {
                    result.setYaMigradas(result.getYaMigradas() + 1);
                }
            } catch (RuntimeException ex) {
                result.setFallidas(result.getFallidas() + 1);
                result.getFallidasIds().add(uuid);
            }
        }
        return result;
    }

    private boolean migrarUna(String uuid) throws ExecutionException, InterruptedException {
        boolean[] escribio = { false };
        computadoraRepository.aplicarHistorial(uuid, (doc, ahora) -> {
            EscrituraHistorial escritura = ComputadoraHistorialReglas.migrar(doc, ahora);
            escribio[0] = escritura.modo() != EscrituraHistorial.Modo.NADA;
            return escritura;
        });
        return escribio[0];
    }

    private ActorHistorial actorDe(String uid) throws ExecutionException, InterruptedException {
        if (uid == null || uid.isBlank()) {
            throw new IllegalArgumentException("No hay usuario de Firebase en la sesión");
        }
        String limpio = uid.trim();
        return usuarioRepository.findById(limpio)
                .map(usuario -> new ActorHistorial(limpio, nombreVisible(usuario)))
                .orElse(new ActorHistorial(limpio, limpio));
    }

    private static String nombreVisible(Usuario usuario) {
        if (usuario.getNombre() != null && !usuario.getNombre().isBlank()) {
            return usuario.getNombre().trim();
        }
        if (usuario.getEmail() != null && !usuario.getEmail().isBlank()) {
            return usuario.getEmail().trim();
        }
        return usuario.getId();
    }

    private static Map<String, Object> traducirReporte(Map<String, Object> cuerpo) {
        Map<String, Object> out = new LinkedHashMap<>();
        copiar(out, cuerpo, "uuid", "uuid");
        copiar(out, cuerpo, "hostname", "hostname");
        copiar(out, cuerpo, "ultimaSincronizacion", "ultima_sincronizacion");
        copiar(out, cuerpo, "ultima_sincronizacion", "ultima_sincronizacion");
        copiar(out, cuerpo, "estadoConexion", "estado_conexion");
        copiar(out, cuerpo, "estado_conexion", "estado_conexion");
        copiar(out, cuerpo, "cpuUsoPorcentaje", "cpu_uso_porcentaje");
        copiar(out, cuerpo, "ramUsoPorcentaje", "ram_uso_porcentaje");
        copiar(out, cuerpo, "ramTotalGb", "ram_total_gb");
        copiar(out, cuerpo, "sistemaOperativo", "sistema_operativo");
        copiar(out, cuerpo, "arquitectura", "arquitectura");
        copiar(out, cuerpo, "usuarioActual", "usuarioActual");
        copiar(out, cuerpo, "perifericos", "perifericos");
        copiar(out, cuerpo, "discos", "discos");
        copiar(out, cuerpo, "modulosRam", "modulos_ram");
        copiar(out, cuerpo, "modulos_ram", "modulos_ram");
        Object sync = out.get("ultima_sincronizacion");
        if (sync instanceof String s && !s.isBlank()) {
            try {
                out.put("ultima_sincronizacion", Timestamp.parseTimestamp(s));
            } catch (RuntimeException ignored) {
                out.put("ultima_sincronizacion", Timestamp.now());
            }
        }
        return out;
    }

    private static void copiar(Map<String, Object> destino, Map<String, Object> origen, String desde, String hacia) {
        if (origen != null && origen.containsKey(desde) && origen.get(desde) != null) {
            destino.put(hacia, origen.get(desde));
        }
    }
}
