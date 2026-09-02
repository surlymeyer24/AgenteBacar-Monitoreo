package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.AudioAgenteDTO;
import com.bacarsa.inventario.dto.DispositivoAudioAgenteDTO;
import com.bacarsa.inventario.dto.DispositivoUsbAgenteDTO;
import com.bacarsa.inventario.dto.ImpresoraAgenteDTO;
import com.bacarsa.inventario.dto.MonitorAgenteDTO;
import com.bacarsa.inventario.dto.PerifericoAgenteDTO;
import com.bacarsa.inventario.models.AudioFirestore;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


public class PerifericosAgenteMapper {

    private PerifericosAgenteMapper() {
        // Constructor privado para evitar instanciación
    }

    public static PerifericoAgenteDTO toDTO(PerifericosFirestore perifericos) {
        if (perifericos == null) {
            return null;
        }

        PerifericoAgenteDTO dto = new PerifericoAgenteDTO();
        dto.setImpresoras(perifericos.getImpresoras() == null
                ? Collections.emptyList()
                : perifericos.getImpresoras().stream()
                        .filter(PerifericosAgenteMapper::esImpresoraFisica)
                        .map(PerifericosAgenteMapper::mapImpresora)
                        .collect(Collectors.toList()));
        dto.setDispositivosUsb(mapearLista(perifericos.getDispositivosUsb(), PerifericosAgenteMapper::mapUsb));
        dto.setMonitores(mapearLista(perifericos.getMonitores(), PerifericosAgenteMapper::mapMonitor));
        dto.setAudio(mapAudio(perifericos.getAudio()));
        return dto;
    }

    // --- Mapeo individual por tipo ---

    private static ImpresoraAgenteDTO mapImpresora(ImpresoraFirestore imp) {
        ImpresoraAgenteDTO dto = new ImpresoraAgenteDTO();
        dto.setNombre(imp.getNombre());
        dto.setDriver(imp.getDriver());
        dto.setPuerto(imp.getPuerto());
        dto.setTipoImpresora(imp.getTipoImpresora());
        dto.setEstado(imp.getEstado());
        dto.setCompartida(imp.getCompartida());
        dto.setPredeterminada(imp.getPredeterminada());
        return dto;
    }

    private static DispositivoUsbAgenteDTO mapUsb(DispositivoUsbFirestore usb) {
        DispositivoUsbAgenteDTO dto = new DispositivoUsbAgenteDTO();
        dto.setNombre(usb.getNombre());
        dto.setFabricante(usb.getFabricante());
        dto.setCategoria(usb.getCategoria());
        dto.setClase(usb.getClase());
        dto.setConexion(usb.getConexion());
        dto.setVid(usb.getVid());
        dto.setPid(usb.getPid());
        return dto;
    }

    public static DispositivoUsbAgenteDTO toDispositivoUsbAgenteDTO(DispositivoUsbFirestore usb) {
        if (usb == null) {
            return null;
        }
        return mapUsb(usb);
    }

    public static DispositivoAudioAgenteDTO toDispositivoAudioAgenteDTO(DispositivoAudioFirestore da) {
        if (da == null) {
            return null;
        }
        return mapDispositivoAudio(da);
    }

    private static MonitorAgenteDTO mapMonitor(MonitorFirestore mon) {
        MonitorAgenteDTO dto = new MonitorAgenteDTO();
        dto.setNombre(sanitizarNombre(mon.getNombre()));
        dto.setResolucion(mon.getResolucion());
        dto.setPulgadas(mon.getPulgadas());
        dto.setAnchoCm(mon.getAnchoCm());
        dto.setAltoCm(mon.getAltoCm());
        dto.setNumeroSerie(mon.getNumeroSerie());
        dto.setFabricante(mon.getFabricante());
        return dto;
    }

    /** Expuesto para armado de listados agregados (misma sanitización que el detalle de PC). */
    public static MonitorAgenteDTO toMonitorAgenteDTO(MonitorFirestore mon) {
        if (mon == null) {
            return null;
        }
        return mapMonitor(mon);
    }

    private static AudioAgenteDTO mapAudio(AudioFirestore audio) {
        if (audio == null) {
            return null;
        }
        AudioAgenteDTO dto = new AudioAgenteDTO();
        dto.setEntrada(mapearLista(audio.getEntrada(), PerifericosAgenteMapper::mapDispositivoAudio));
        dto.setSalida(mapearLista(audio.getSalida(), PerifericosAgenteMapper::mapDispositivoAudio));
        return dto;
    }

    private static DispositivoAudioAgenteDTO mapDispositivoAudio(DispositivoAudioFirestore da) {
        DispositivoAudioAgenteDTO dto = new DispositivoAudioAgenteDTO();
        dto.setNombre(da.getNombre());
        dto.setFabricante(da.getFabricante());
        dto.setEstado(da.getEstado());
        return dto;
    }

    // --- Helpers ---

    /** Mapea una lista null-safe: si la fuente es null, retorna lista vacía. */
    private static <S, D> List<D> mapearLista(List<S> fuente, java.util.function.Function<S, D> mapper) {
        if (fuente == null) {
            return Collections.emptyList();
        }
        return fuente.stream().map(mapper).collect(Collectors.toList());
    }

    private static boolean esImpresoraFisica(ImpresoraFirestore imp) {
        if (imp == null) return false;
        String ti = normLower(imp.getTipoImpresora());
        String t  = normLower(imp.getTipo());
        if (ti.contains("virtual") || t.contains("virtual")) return false;
        String nombre = normLower(imp.getNombre());
        String driver = normLower(imp.getDriver());
        String puerto = normLower(imp.getPuerto());
        if ((nombre + " " + driver + " " + puerto).contains("anydesk") || puerto.contains("ad_port")) return false;
        if (nombre.contains("microsoft print to pdf")) return false;
        if (nombre.contains("microsoft xps document writer")) return false;
        if (nombre.contains("onenote") || nombre.contains("send to onenote")) return false;
        if (driver.contains("send to microsoft onenote")) return false;
        if (driver.contains("microsoft shared fax driver")) return false;
        if ("fax".equals(nombre) && driver.contains("fax")) return false;
        return true;
    }

    private static String normLower(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    /** Limpia caracteres nulos (\0) que el agente puede incluir en nombres de monitor. */
    private static String sanitizarNombre(String nombre) {
        if (nombre == null) {
            return null;
        }
        return nombre.replace("\0", "").trim();
    }
}
