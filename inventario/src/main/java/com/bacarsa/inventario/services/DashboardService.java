package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CambioRecienteDTO;
import com.bacarsa.inventario.dto.DashboardStatsDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.CambioEstado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.InternoIpRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.util.ImpresoraIpHelper;
import com.google.cloud.Timestamp;

@Service
public class DashboardService {

    private static final int MAX_CAMBIOS_RECIENTES = 10;
    /**
     * 2× ciclo base del agente (~5 min) + 90 s margen — mismo criterio que el front ({@code syncActividad.js}).
     */
    private static final long SYNC_UMBRAL_ACTIVO_MS = 10L * 60 * 1000 + 90_000;
    private static final long SYNC_UMBRAL_INACTIVO_MS = 60L * 60 * 1000;

    private final ComputadoraRepository computadoraRepository;
    private final CamaraRepository camaraRepository;
    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;
    private final InternoIpRepository internoIpRepository;

    public DashboardService(ComputadoraRepository computadoraRepository,
            CamaraRepository camaraRepository,
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository,
            InternoIpRepository internoIpRepository) {
        this.computadoraRepository = computadoraRepository;
        this.camaraRepository = camaraRepository;
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
        this.internoIpRepository = internoIpRepository;
    }

    public DashboardStatsDTO getStats() throws ExecutionException, InterruptedException {
        CompletableFuture<List<Computadora>> fPc = supplyAsyncRepo(computadoraRepository::findAll);
        CompletableFuture<List<Camara>> fCam = supplyAsyncRepo(camaraRepository::findAll);
        CompletableFuture<List<Router>> fRou = supplyAsyncRepo(routerRepository::findAll);
        CompletableFuture<List<SwitchRed>> fSw = supplyAsyncRepo(switchRedRepository::findAll);
        CompletableFuture<List<AccessPoint>> fAp = supplyAsyncRepo(accessPointRepository::findAll);
        CompletableFuture<Integer> fTel = supplyAsyncRepo(() -> internoIpRepository.findAll().size());
        try {
            CompletableFuture.allOf(fPc, fCam, fRou, fSw, fAp, fTel).join();
        } catch (CompletionException ex) {
            Throwable c = ex.getCause();
            if (c instanceof InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw ie;
            }
            if (c instanceof ExecutionException ee) {
                throw ee;
            }
            throw new ExecutionException(c != null ? c : ex);
        }

        List<Computadora> computadoras = fPc.join();
        List<Camara> camaras = fCam.join();
        List<Router> routers = fRou.join();
        List<SwitchRed> switches = fSw.join();
        List<AccessPoint> accessPoints = fAp.join();

        DashboardStatsDTO stats = new DashboardStatsDTO();

        // Totales
        stats.setTotalComputadoras(computadoras.size());
        stats.setTotalCamaras(camaras.size());
        stats.setTotalRouters(routers.size());
        stats.setTotalSwitches(switches.size());
        stats.setTotalAccessPoints(accessPoints.size());
        stats.setTotalTelefonos(fTel.join());

        int notebooks = 0;
        int sinAsignar = 0;
        for (Computadora c : computadoras) {
            if (c.getTipoEquipo() != null && c.getTipoEquipo().getTipo() != null
                    && c.getTipoEquipo().getTipo().toLowerCase().contains("notebook")) {
                notebooks++;
            }
            if (c.getEstadoActual() != null && "Sin Asignar".equalsIgnoreCase(c.getEstadoActual().getNombre())) {
                sinAsignar++;
            }
        }
        stats.setTotalNotebooks(notebooks);
        stats.setTotalDesktops(computadoras.size() - notebooks);
        stats.setStockPcsSinAsignar(sinAsignar);

        // Conexión de computadoras
        int conectadas = 0;
        for (Computadora c : computadoras) {
            if ("ONLINE".equalsIgnoreCase(c.getEstadoConexion())) {
                conectadas++;
            }
        }
        stats.setComputadorasConectadas(conectadas);
        stats.setComputadorasDesconectadas(computadoras.size() - conectadas);

        int totalPerifericos = 0;
        int syncActivoUmbral = 0;
        int syncIntermedio = 0;
        int sinActividad1h = 0;
        for (Computadora c : computadoras) {
            totalPerifericos += contarPerifericos(c);
            switch (bandaActividadSync(c)) {
                case ACTIVO -> syncActivoUmbral++;
                case INTERMEDIO -> syncIntermedio++;
                case SIN_ACTIVIDAD, SIN_DATOS -> sinActividad1h++;
            }
        }
        stats.setTotalPerifericos(totalPerifericos);
        stats.setPerifericosPorTipo(acumularPerifericosPorTipo(computadoras));
        stats.setComputadorasSyncMenos10Min(syncActivoUmbral);
        stats.setComputadorasSyncEntre10MinY1h(syncIntermedio);
        stats.setComputadorasSinActividadMas1h(sinActividad1h);

        // Por estado operativo
        stats.setPorEstadoComputadoras(contarPorEstado(
                computadoras.stream().map(Computadora::getEstadoActual).toList()));
        stats.setPorEstadoCamaras(contarPorEstado(
                camaras.stream().map(Camara::getEstadoActual).toList()));
        stats.setPorEstadoRouters(contarPorEstado(
                routers.stream().map(Router::getEstadoActual).toList()));
        stats.setPorEstadoSwitches(contarPorEstado(
                switches.stream().map(SwitchRed::getEstadoActual).toList()));

        // Por ubicación
        Map<String, Integer> porUbPC = inicializarMapa(Ubicacion.values());
        for (Computadora c : computadoras) {
            if (c.getUbicacion() != null) {
                porUbPC.merge(c.getUbicacion().name(), 1, Integer::sum);
            }
        }
        stats.setPorUbicacionComputadoras(porUbPC);

        Map<String, Integer> porUbCam = new LinkedHashMap<>();
        for (Camara cam : camaras) {
            if (cam.getUbicacion() != null && !cam.getUbicacion().isBlank()) {
                porUbCam.merge(cam.getUbicacion(), 1, Integer::sum);
            }
        }
        stats.setPorUbicacionCamaras(porUbCam);

        Map<String, Integer> porUbRouter = inicializarMapa(UbicacionRed.values());
        for (Router r : routers) {
            if (r.getUbicacion() != null) {
                porUbRouter.merge(r.getUbicacion().name(), 1, Integer::sum);
            }
        }
        stats.setPorUbicacionRouters(porUbRouter);

        Map<String, Integer> porUbSwitch = inicializarMapa(UbicacionRed.values());
        for (SwitchRed sw : switches) {
            if (sw.getUbicacion() != null) {
                porUbSwitch.merge(sw.getUbicacion().name(), 1, Integer::sum);
            }
        }
        stats.setPorUbicacionSwitches(porUbSwitch);

        // Actividad reciente
        stats.setUltimosCambios(armarUltimosCambios(computadoras, camaras, routers, switches));

        return stats;
    }

    @FunctionalInterface
    private interface FirestoreSupplier<T> {
        T get() throws ExecutionException, InterruptedException;
    }

    private static <T> CompletableFuture<T> supplyAsyncRepo(FirestoreSupplier<T> supplier) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return supplier.get();
            } catch (ExecutionException e) {
                Throwable c = e.getCause() != null ? e.getCause() : e;
                throw new CompletionException(c);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new CompletionException(e);
            }
        });
    }

    private enum BandaActividadSync {
        ACTIVO,
        INTERMEDIO,
        SIN_ACTIVIDAD,
        SIN_DATOS
    }

    private static BandaActividadSync bandaActividadSync(Computadora c) {
        Timestamp ts = c.getUltimaSincronizacion();
        if (ts == null) {
            return BandaActividadSync.SIN_DATOS;
        }
        long ageMs = System.currentTimeMillis() - ts.toDate().getTime();
        if (ageMs < SYNC_UMBRAL_ACTIVO_MS) {
            return BandaActividadSync.ACTIVO;
        }
        if (ageMs > SYNC_UMBRAL_INACTIVO_MS) {
            return BandaActividadSync.SIN_ACTIVIDAD;
        }
        return BandaActividadSync.INTERMEDIO;
    }

    private static int contarPerifericos(Computadora c) {
        PerifericosFirestore p = c.getPerifericos();
        if (p == null) {
            return 0;
        }
        int n = 0;
        if (p.getImpresoras() != null) {
            for (ImpresoraFirestore imp : p.getImpresoras()) {
                if (esImpresoraFisicaParaConteo(imp)) {
                    n++;
                }
            }
        }
        if (p.getDispositivosUsb() != null) {
            for (DispositivoUsbFirestore usb : p.getDispositivosUsb()) {
                if (!debeOcultarUsbParaConteo(usb)) {
                    n++;
                }
            }
        }
        if (p.getMonitores() != null) {
            n += p.getMonitores().size();
        }
        if (p.getAudio() != null) {
            if (p.getAudio().getEntrada() != null) {
                n += p.getAudio().getEntrada().size();
            }
            if (p.getAudio().getSalida() != null) {
                n += p.getAudio().getSalida().size();
            }
        }
        return n;
    }

    private static int contarImpresorasUnicas(List<Computadora> computadoras) {
        Set<String> ips = new HashSet<>();
        for (Computadora c : computadoras) {
            PerifericosFirestore p = c.getPerifericos();
            if (p == null || p.getImpresoras() == null) continue;
            for (ImpresoraFirestore imp : p.getImpresoras()) {
                if (!esImpresoraFisicaParaConteo(imp)) continue;
                String ip = ImpresoraIpHelper.extraerIp(imp.getPuerto());
                if (ip == null) continue;
                ips.add(ip);
            }
        }
        return ips.size();
    }

    private static final List<String> ORDEN_PERIFERICOS_TIPO = List.of(
            "Impresoras",
            "Monitores",
            "Teclados",
            "Mouse",
            "Webcams",
            "Parlantes",
            "Micrófonos");

    private Map<String, Integer> acumularPerifericosPorTipo(List<Computadora> computadoras) {
        Map<String, Integer> raw = new HashMap<>();
        raw.put("Impresoras", contarImpresorasUnicas(computadoras));
        for (Computadora c : computadoras) {
            acumularPerifericosPorTipoDesdePc(c, raw);
        }
        Map<String, Integer> ordenado = new LinkedHashMap<>();
        for (String k : ORDEN_PERIFERICOS_TIPO) {
            ordenado.put(k, raw.getOrDefault(k, 0));
        }
        return ordenado;
    }

    private void acumularPerifericosPorTipoDesdePc(Computadora c, Map<String, Integer> map) {
        PerifericosFirestore p = c.getPerifericos();
        if (p == null) {
            return;
        }
        if (p.getMonitores() != null) {
            mergeTipo(map, "Monitores", p.getMonitores().size());
        }
        if (p.getDispositivosUsb() != null) {
            for (DispositivoUsbFirestore usb : p.getDispositivosUsb()) {
                if (debeOcultarUsbParaConteo(usb)) {
                    continue;
                }
                String tipoUsb = clasificarUsbTipo(usb);
                if (excluirTipoDelDesgloseDashboard(tipoUsb)) {
                    continue;
                }
                mergeTipo(map, tipoUsb, 1);
            }
        }
        if (p.getAudio() != null) {
            if (p.getAudio().getEntrada() != null) {
                mergeTipo(map, "Micrófonos", p.getAudio().getEntrada().size());
            }
            if (p.getAudio().getSalida() != null) {
                mergeTipo(map, "Parlantes", p.getAudio().getSalida().size());
            }
        }
    }

    private static void mergeTipo(Map<String, Integer> map, String tipo, int delta) {
        map.merge(tipo, delta, Integer::sum);
    }

    /** No se muestran en la tarjeta de desglose del dashboard (ruido / poco útil). */
    private static boolean excluirTipoDelDesgloseDashboard(String tipo) {
        return "Bluetooth".equals(tipo) || "USB (otro)".equals(tipo);
    }

    /**
     * Heurística alineada al front ({@code tipoUsb} en PerifericosTodosList): teclado, mouse, webcam
     * (clase Camera), bluetooth, resto.
     */
    private static String clasificarUsbTipo(DispositivoUsbFirestore d) {
        if (d == null) {
            return "USB (otro)";
        }
        String clase = normLower(d.getClase());
        String nombre = normLower(d.getNombre());
        String categoria = normLower(d.getCategoria());
        if (clase.contains("keyboard") || nombre.contains("teclado") || nombre.contains("keyboard")) {
            return "Teclados";
        }
        if (clase.contains("mouse") || nombre.contains("mouse")) {
            return "Mouse";
        }
        if (clase.contains("camera")) {
            return "Webcams";
        }
        if ("bluetooth".equals(clase) || nombre.contains("bluetooth") || categoria.contains("bluetooth")) {
            return "Bluetooth";
        }
        return "USB (otro)";
    }

    /** Misma idea que {@code esImpresoraFisica} en el front (excluye virtuales / PDF / etc.). */
    private static boolean esImpresoraFisicaParaConteo(ImpresoraFirestore p) {
        if (p == null) {
            return false;
        }
        String ti = normLower(p.getTipoImpresora());
        String t = normLower(p.getTipo());
        if (ti.contains("virtual") || t.contains("virtual")) {
            return false;
        }
        String nombre = normLower(p.getNombre());
        String driver = normLower(p.getDriver());
        String puerto = normLower(p.getPuerto());
        String blob = nombre + " " + driver + " " + puerto;
        if (blob.contains("anydesk") || puerto.contains("ad_port")) {
            return false;
        }
        if (nombre.contains("microsoft print to pdf")) {
            return false;
        }
        if (nombre.contains("microsoft xps document writer")) {
            return false;
        }
        if (nombre.contains("onenote") || nombre.contains("send to onenote")) {
            return false;
        }
        if (driver.contains("send to microsoft onenote")) {
            return false;
        }
        if (driver.contains("microsoft shared fax driver")) {
            return false;
        }
        if ("fax".equals(nombre) && driver.contains("fax")) {
            return false;
        }
        return true;
    }

    /** Controlador HID genérico (HIDClass): no suma como periférico; alineado al filtro del front. */
    private static boolean debeOcultarUsbParaConteo(DispositivoUsbFirestore d) {
        if (d == null) {
            return true;
        }
        String clase = normLower(d.getClase());
        if (!clase.contains("hidclass")) {
            return false;
        }
        String nombre = normLower(d.getNombre());
        String cat = normLower(d.getCategoria());
        return nombre.contains("controlador hid") || cat.contains("controlador hid");
    }

    private static String normLower(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private Map<String, Integer> contarPorEstado(List<Estado> estados) {
        Map<String, Integer> mapa = new LinkedHashMap<>();
        for (EstadoOperativo op : EstadoOperativo.values()) {
            mapa.put(op.name(), 0);
        }
        for (Estado estado : estados) {
            if (estado == null || estado.getNombre() == null) {
                continue;
            }
            EstadoOperativo op = resolverEstadoOperativo(estado.getNombre());
            if (op != null) {
                mapa.merge(op.name(), 1, Integer::sum);
            }
        }
        return mapa;
    }

    private EstadoOperativo resolverEstadoOperativo(String nombre) {
        if (nombre == null) {
            return null;
        }
        String n = nombre.trim();
        if ("Activo".equalsIgnoreCase(n) || "ACTIVO".equalsIgnoreCase(n)) {
            return EstadoOperativo.ASIGNADA;
        }
        if ("Fuera de servicio".equalsIgnoreCase(n) || "FUERA_DE_SERVICIO".equalsIgnoreCase(n)) {
            return EstadoOperativo.BAJA;
        }
        for (EstadoOperativo op : EstadoOperativo.values()) {
            if (op.getNombre().equalsIgnoreCase(n) || op.name().equalsIgnoreCase(n)) {
                return op;
            }
        }
        return null;
    }

    private <E extends Enum<E>> Map<String, Integer> inicializarMapa(E[] valores) {
        Map<String, Integer> mapa = new LinkedHashMap<>();
        for (E v : valores) {
            mapa.put(v.name(), 0);
        }
        return mapa;
    }

    private List<CambioRecienteDTO> armarUltimosCambios(List<Computadora> computadoras,
            List<Camara> camaras, List<Router> routers, List<SwitchRed> switches) {
        List<CambioConEntidad> todos = new ArrayList<>();

        for (Computadora c : computadoras) {
            if (c.getHistorialEstados() == null) continue;
            for (CambioEstado ce : c.getHistorialEstados()) {
                todos.add(new CambioConEntidad("computadora", c.getUuid(), c.getHostname(), ce));
            }
        }
        for (Camara cam : camaras) {
            if (cam.getHistorialEstados() == null) continue;
            for (CambioEstado ce : cam.getHistorialEstados()) {
                todos.add(new CambioConEntidad("camara", cam.getId(), cam.getNombre(), ce));
            }
        }
        for (Router r : routers) {
            if (r.getHistorialEstados() == null) continue;
            for (CambioEstado ce : r.getHistorialEstados()) {
                todos.add(new CambioConEntidad("router", r.getId(), r.getNombre(), ce));
            }
        }
        for (SwitchRed sw : switches) {
            if (sw.getHistorialEstados() == null) continue;
            for (CambioEstado ce : sw.getHistorialEstados()) {
                todos.add(new CambioConEntidad("switch", sw.getId(), sw.getNombre(), ce));
            }
        }

        return todos.stream()
                .filter(x -> x.cambio().getFechaHoraInicio() != null)
                .sorted(Comparator.comparing(
                        (CambioConEntidad x) -> x.cambio().getFechaHoraInicio()).reversed())
                .limit(MAX_CAMBIOS_RECIENTES)
                .map(this::toCambioRecienteDTO)
                .toList();
    }

    private CambioRecienteDTO toCambioRecienteDTO(CambioConEntidad x) {
        CambioEstado ce = x.cambio();
        String estadoNombre = (ce.getEstado() == null) ? null : ce.getEstado().getNombre();
        Timestamp inicio = ce.getFechaHoraInicio();
        return new CambioRecienteDTO(
                x.tipo(),
                x.entidadId(),
                x.entidadNombre(),
                estadoNombre,
                ce.getMotivo(),
                inicio == null ? null : inicio.toDate().toInstant().toString()
        );
    }

    private record CambioConEntidad(String tipo, String entidadId, String entidadNombre, CambioEstado cambio) {}
}
