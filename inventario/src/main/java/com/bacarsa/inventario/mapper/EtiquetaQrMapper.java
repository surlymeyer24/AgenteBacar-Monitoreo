package com.bacarsa.inventario.mapper;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

import com.bacarsa.inventario.dto.DispositivoUsbAgenteDTO;
import com.bacarsa.inventario.dto.EtiquetaQrDetalleDTO;
import com.bacarsa.inventario.dto.EtiquetaQrItemDTO;
import com.bacarsa.inventario.dto.EtiquetaQrListadoDTO;
import com.bacarsa.inventario.dto.MonitorAgenteDTO;
import com.bacarsa.inventario.dto.PerifericoAgenteDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.PerifericosFirestore;

public class EtiquetaQrMapper {

    private EtiquetaQrMapper() {}

    public static EtiquetaQrListadoDTO toListado(Computadora pc, List<PerifericoManual> manualesDeLaPc) {
        if (pc == null) {
            return null;
        }
        PerifericosFirestore agente = pc.getPerifericos();
        int cantidadMonitores = agente == null || agente.getMonitores() == null
                ? 0
                : (int) agente.getMonitores().stream().filter(mon -> mon != null).count();
        int cantidadPerifericos = contarUsbTecladoOMouse(agente)
                + contarManualesTecladoOMouse(manualesDeLaPc);

        EtiquetaQrListadoDTO dto = new EtiquetaQrListadoDTO();
        dto.setUuid(pc.getUuid());
        dto.setHostname(pc.getHostname());
        dto.setUsuarioActual(pc.getUsuarioActual());
        dto.setUbicacion(pc.getUbicacion() == null ? null : pc.getUbicacion().name());
        dto.setTipoEquipo(pc.getTipoEquipo() != null ? pc.getTipoEquipo().getTipo() : null);
        dto.setCantidadMonitores(cantidadMonitores);
        dto.setCantidadPerifericos(cantidadPerifericos);
        return dto;
    }

    public static EtiquetaQrDetalleDTO toDetalle(Computadora pc, List<PerifericoManual> manualesDeLaPc) {
        if (pc == null) {
            return null;
        }
        PerifericoAgenteDTO agente = PerifericosAgenteMapper.toDTO(pc.getPerifericos());
        List<EtiquetaQrItemDTO> monitores = monitoresDesdeAgente(agente);
        List<EtiquetaQrItemDTO> perifericos = perifericosDesdeAgente(agente);
        agregarManuales(perifericos, manualesDeLaPc);

        EtiquetaQrDetalleDTO dto = new EtiquetaQrDetalleDTO();
        dto.setUuid(pc.getUuid());
        dto.setHostname(pc.getHostname());
        dto.setUsuarioActual(pc.getUsuarioActual());
        dto.setUbicacion(pc.getUbicacion() == null ? null : pc.getUbicacion().name());
        dto.setTipoEquipo(pc.getTipoEquipo() != null ? pc.getTipoEquipo().getTipo() : null);
        dto.setResponsableInventario(pc.getResponsableInventario());
        dto.setMonitores(monitores);
        dto.setPerifericos(perifericos);
        return dto;
    }

    private static List<EtiquetaQrItemDTO> monitoresDesdeAgente(PerifericoAgenteDTO agente) {
        List<EtiquetaQrItemDTO> items = new ArrayList<>();
        if (agente == null || agente.getMonitores() == null) {
            return items;
        }
        for (MonitorAgenteDTO mon : agente.getMonitores()) {
            if (mon == null) {
                continue;
            }
            String nombre = textoONull(mon.getNombre());
            if (nombre == null) {
                nombre = "Monitor";
            }
            EtiquetaQrItemDTO item = new EtiquetaQrItemDTO("Monitor", nombre, detalleMonitor(mon));
            item.setNumeroSerie(textoONull(mon.getNumeroSerie()));
            items.add(item);
        }
        return items;
    }

    private static List<EtiquetaQrItemDTO> perifericosDesdeAgente(PerifericoAgenteDTO agente) {
        List<EtiquetaQrItemDTO> items = new ArrayList<>();
        if (agente == null) {
            return items;
        }
        if (agente.getDispositivosUsb() != null) {
            for (DispositivoUsbAgenteDTO usb : agente.getDispositivosUsb()) {
                if (usb == null || !esUsbTecladoOMouse(usb)) {
                    continue;
                }
                String tipo = tipoTecladoOMouse(usb);
                String nombre = textoONull(usb.getNombre());
                if (nombre == null) {
                    continue;
                }
                items.add(new EtiquetaQrItemDTO(
                        tipo,
                        nombre,
                        unir(" · ",
                                usb.getFabricante(),
                                usb.getConexion(),
                                unir("/",
                                        usb.getVid() != null ? "VID_" + usb.getVid() : null,
                                        usb.getPid() != null ? "PID_" + usb.getPid() : null))));
            }
        }
        return items;
    }

    /**
     * En la ficha QR solo viajan monitores (lista aparte), teclado y mouse.
     * El resto (webcams, audio, impresoras, HID genérico, stock de depósito) queda fuera.
     */
    private static boolean esUsbTecladoOMouse(DispositivoUsbAgenteDTO usb) {
        return esTecladoOMouse(usb.getCategoria())
                || esTecladoOMouse(usb.getClase())
                || esTecladoOMouse(usb.getNombre());
    }

    private static int contarUsbTecladoOMouse(PerifericosFirestore perifericos) {
        if (perifericos == null || perifericos.getDispositivosUsb() == null) {
            return 0;
        }
        return (int) perifericos.getDispositivosUsb().stream()
                .filter(usb -> usb != null && esUsbTecladoOMouse(usb))
                .count();
    }

    private static boolean esUsbTecladoOMouse(DispositivoUsbFirestore usb) {
        return esTecladoOMouse(usb.getCategoria())
                || esTecladoOMouse(usb.getClase())
                || esTecladoOMouse(usb.getNombre());
    }

    private static int contarManualesTecladoOMouse(List<PerifericoManual> manuales) {
        if (manuales == null) {
            return 0;
        }
        return (int) manuales.stream()
                .filter(p -> p != null && (esTecladoOMouse(p.getTipo()) || esTecladoOMouse(p.getNombre())))
                .filter(p -> textoONull(p.getNombre()) != null)
                .count();
    }

    private static boolean esTecladoOMouse(String tipoRaw) {
        String t = normalizar(tipoRaw);
        if (t.isEmpty()) {
            return false;
        }
        return t.contains("teclado")
                || t.contains("keyboard")
                || t.contains("mouse");
    }

    private static String tipoTecladoOMouse(DispositivoUsbAgenteDTO usb) {
        String categoria = textoONull(usb.getCategoria());
        if (categoria != null) {
            return categoria;
        }
        if (esMouse(usb.getClase()) || esMouse(usb.getNombre())) {
            return "Mouse";
        }
        return "Teclado";
    }

    private static boolean esMouse(String tipoRaw) {
        return normalizar(tipoRaw).contains("mouse");
    }

    /** Minúsculas sin acentos, para comparar categorías que llegan escritas de varias formas. */
    private static String normalizar(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private static void agregarManuales(List<EtiquetaQrItemDTO> items, List<PerifericoManual> manuales) {
        if (manuales == null) {
            return;
        }
        for (PerifericoManual p : manuales) {
            if (p == null || !(esTecladoOMouse(p.getTipo()) || esTecladoOMouse(p.getNombre()))) {
                continue;
            }
            String tipo = textoONull(p.getTipo());
            if (tipo == null) {
                tipo = "Depósito";
            }
            String nombre = textoONull(p.getNombre());
            if (nombre == null) {
                continue;
            }
            items.add(new EtiquetaQrItemDTO(
                    tipo + " (depósito)",
                    nombre,
                    unir(" · ", p.getFabricante(), p.getConexion(), p.getUbicacion())));
        }
    }

    private static String detalleMonitor(MonitorAgenteDTO mon) {
        List<String> partes = new ArrayList<>();
        if (mon.getPulgadas() != null) {
            partes.add(mon.getPulgadas() + "\"");
        }
        if (textoONull(mon.getResolucion()) != null) {
            partes.add(mon.getResolucion());
        }
        if (textoONull(mon.getNumeroSerie()) != null) {
            partes.add("S/N: " + mon.getNumeroSerie());
        }
        return String.join(" · ", partes);
    }

    private static String unir(String sep, String... partes) {
        List<String> ok = new ArrayList<>();
        if (partes == null) {
            return "";
        }
        for (String p : partes) {
            String t = textoONull(p);
            if (t != null) {
                ok.add(t);
            }
        }
        return String.join(sep, ok);
    }

    private static String textoONull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.replace("\0", "").trim();
        return t.isEmpty() ? null : t;
    }
}
