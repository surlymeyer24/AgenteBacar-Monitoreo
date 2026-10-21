package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Disco;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.models.UbicacionRed;

public final class ProyeccionStock {

    private ProyeccionStock() {
    }

    public static FichaLectura desdeComputadora(Computadora computadora) {
        String tipoRaw = computadora.getTipoEquipo() == null ? null : computadora.getTipoEquipo().getTipo();
        String prefijo = null;
        String tipo = "computadora";
        if (tipoRaw != null && tipoRaw.toLowerCase(Locale.ROOT).contains("notebook")) {
            prefijo = "NB";
            tipo = "notebook";
        } else if (tipoRaw != null && "desktop".equalsIgnoreCase(tipoRaw.trim())) {
            prefijo = "PC";
            tipo = "desktop";
        }
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.COMPUTADORAS,
                computadora.getUuid(),
                computadora.getCodigoInterno(),
                prefijo,
                motivoComputadora(computadora, prefijo),
                tipo,
                "",
                "",
                computadora.getSerialEquipo(),
                computadora.getCondicion(),
                estado(computadora.getEstadoActual(), null),
                "",
                ubicacion(computadora.getUbicacion()));
        String desc = descripcionDesdeSpec(computadora.getEspecificacionEsperada());
        if (desc.isEmpty()) {
            desc = descripcionDesdeAgente(computadora);
        }
        ficha.setDescripcionCompleta(desc);
        return ficha;
    }

    static String motivoComputadora(Computadora pc, String prefijo) {
        if (pc == null || pc.getUuid() == null || pc.getUuid().isBlank()) {
            return "sin_id";
        }
        if (Boolean.TRUE.equals(pc.getEnDeposito())) {
            return null;
        }
        boolean sinUsuario = esUsuarioSistema(pc.getUsuarioActual());
        boolean sinAsignar = esSinAsignar(pc.getEstadoActual());
        return calcularMotivo(pc, prefijo, sinUsuario, sinAsignar);
    }

    private static String calcularMotivo(Computadora pc, String prefijo, boolean sinUsuario, boolean sinAsignar) {
        if (sinAsignar && sinUsuario) {
            return null;
        }
        OrigenAlta origen = pc.getOrigenAlta();
        if (origen == OrigenAlta.DETECTADA_POR_AGENTE || origen == OrigenAlta.DETECTADA_VINCULADA_RETRO) {
            return "agente_operativo";
        }
        if (pc.getUltimaSincronizacion() != null) {
            return "agente_sincronizado";
        }
        if (sinUsuario && origen == OrigenAlta.STOCK) {
            return null;
        }
        if (!sinUsuario && origen != OrigenAlta.STOCK) {
            return "asignada_operativa";
        }
        if (prefijo == null) {
            return "tipo_desconocido";
        }
        return null;
    }

    private static boolean esSinAsignar(Estado estado) {
        if (estado == null || estado.getNombre() == null || estado.getNombre().isBlank()) return false;
        String nombre = estado.getNombre().trim().toUpperCase(Locale.ROOT);
        return nombre.contains("SIN ASIGNAR") || nombre.contains("SIN_ASIGNAR");
    }

    private static boolean esUsuarioSistema(String usuario) {
        if (usuario == null || usuario.isBlank()) return true;
        String u = usuario.trim().toUpperCase(Locale.ROOT);
        return "SYSTEM".equals(u) || "LOCAL SERVICE".equals(u) || "NETWORK SERVICE".equals(u);
    }

    public static FichaLectura desdePeriferico(PerifericoManual periferico) {
        String tipoRaw = periferico.getTipo();
        String prefijo = prefijoPeriferico(tipoRaw);
        String tipo = prefijo == null ? "" : tipoRaw.trim().toLowerCase(Locale.ROOT);
        if ("computadora".equals(tipo) || "pc".equals(tipo)) {
            tipo = "desktop";
        } else if ("laptop".equals(tipo)) {
            tipo = "notebook";
        }

        String marca = periferico.getFabricante() != null ? periferico.getFabricante().trim() : "";
        String modelo = periferico.getNombre() != null ? periferico.getNombre().trim() : "";
        if (marca.isBlank() && ("desktop".equals(tipo) || "notebook".equals(tipo))) {
            marca = !modelo.isBlank() ? modelo : "PC Clon";
            modelo = periferico.getNotas() != null ? periferico.getNotas().trim() : "";
        } else if (modelo.isBlank() && periferico.getNotas() != null) {
            modelo = periferico.getNotas().trim();
        }

        String estadoTexto = estado(periferico.getEstadoActual(), null);
        String motivo = motivo(periferico.getId(), prefijo, periferico.getCantidad());
        if (motivo == null) {
            motivo = motivoPerifericoEnUso(periferico, estadoTexto);
        }
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES,
                periferico.getId(),
                periferico.getCodigoInterno(),
                prefijo,
                motivo,
                tipo,
                marca,
                modelo,
                periferico.getNumeroSerie(),
                periferico.getCondicion() != null ? periferico.getCondicion() : "",
                estadoTexto,
                periferico.getFechaAlta(),
                periferico.getUbicacion(),
                periferico.getCantidad(),
                periferico.getComentarios());
        if ("desktop".equals(tipo) || "notebook".equals(tipo)) {
            ficha.setDescripcionCompleta(descripcionDesdeSpec(periferico.getEspecificacionStock()));
        }
        return ficha;
    }

    /** Periférico conectado a una PC: no entra como unidad independiente a stock. */
    static String motivoPerifericoEnUso(PerifericoManual periferico, String estadoTexto) {
        if (tieneTexto(periferico.getComputadoraUuid()) || tieneTexto(periferico.getComputadoraHostname())) {
            return "asignado_a_computadora";
        }
        return null;
    }

    static boolean esEstadoOperativo(String estado) {
        if (estado == null || estado.isBlank()) {
            return false;
        }
        String e = estado.trim().toUpperCase(Locale.ROOT);
        return e.contains("OPERATIV")
                || e.equals("ACTIVA")
                || e.equals("ACTIVO")
                || e.contains("EN_USO")
                || e.contains("EN USO")
                || e.contains("ASIGNAD")
                || e.contains("EN RACK")
                || e.contains("EN_RACK")
                || e.contains("CONECTAD")
                || e.contains("INSTALAD");
    }

    static boolean esUbicacionDeposito(String ubicacion) {
        if (ubicacion == null || ubicacion.isBlank()) {
            return true;
        }
        String u = ubicacion.trim().toLowerCase(Locale.ROOT);
        return u.contains("deposito")
                || u.contains("depósito")
                || u.contains("stock")
                || u.contains("almacen")
                || u.contains("almacén")
                || u.contains("bodega")
                || u.contains("estante")
                || u.contains("pañol")
                || u.contains("panol")
                || u.contains("taller")
                || u.contains("sistemas");
    }

    static String descripcionDesdeAgente(Computadora pc) {
        List<String> partes = new ArrayList<>();
        if (tieneTexto(pc.getProcesadorRaw())) partes.add(pc.getProcesadorRaw().trim());
        if (pc.getRamTotalGb() != null && pc.getRamTotalGb() > 0) {
            partes.add(((int) Math.ceil(pc.getRamTotalGb())) + " GB RAM");
        }
        if (pc.getDiscos() != null && !pc.getDiscos().isEmpty()) {
            double totalGb = pc.getDiscos().stream().mapToDouble(Disco::getTotalGB).sum();
            if (totalGb > 0) {
                partes.add(((int) Math.ceil(totalGb)) + " GB disco");
            }
        }
        return String.join(" · ", partes);
    }

    public static String descripcionDesdeSpec(EspecificacionStock spec) {
        if (spec == null) return "";
        List<String> partes = new ArrayList<>();
        if (tieneTexto(spec.getCpuModelo())) partes.add(spec.getCpuModelo().trim());
        if (spec.getRamTotalGb() != null && spec.getRamTotalGb() > 0) partes.add(spec.getRamTotalGb() + " GB RAM");
        if (tieneTexto(spec.getDiscoResumen())) partes.add(spec.getDiscoResumen().trim());
        return String.join(" · ", partes);
    }

    private static boolean tieneTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    public static FichaLectura desdeCelular(Celular celular) {
        return armar(
                ColeccionesStock.CELULARES,
                celular.getId(),
                celular.getCodigoInterno(),
                "CEL",
                null,
                "celular",
                celular.getMarca(),
                celular.getModelo(),
                celular.getImei(),
                "",
                estado(null, celular.getEstado()),
                "",
                "");
    }

    public static FichaLectura desdeCamara(Camara camara) {
        return armar(
                ColeccionesStock.CAMARAS,
                camara.getId(),
                camara.getCodigoInterno(),
                "CAM",
                null,
                "camara",
                camara.getMarca(),
                camara.getTipo(),
                "",
                "",
                estado(camara.getEstadoActual(), null),
                camara.getFechaAlta(),
                camara.getUbicacion());
    }

    public static FichaLectura desdeTelevisor(Televisor televisor) {
        return armar(
                ColeccionesStock.TELEVISORES,
                televisor.getId(),
                televisor.getCodigoInterno(),
                "TV",
                null,
                "televisor",
                televisor.getMarca(),
                televisor.getModelo(),
                televisor.getNumeroSerie(),
                "",
                estado(null, televisor.getEstado()),
                "",
                "");
    }

    static String motivoInfraestructura(String id, String prefijo, String estadoTexto, String ubicacionTexto) {
        String base = motivo(id, prefijo, 1);
        if (base != null) {
            return base;
        }
        if (esEstadoOperativo(estadoTexto)) {
            return "infraestructura_operativa";
        }
        if (ubicacionTexto != null && !ubicacionTexto.isBlank() && !esUbicacionDeposito(ubicacionTexto)) {
            return "ubicacion_operativa";
        }
        return null;
    }

    public static FichaLectura desdeRouter(Router router) {
        String estadoTexto = estado(router.getEstadoActual(), router.getEstado());
        String ubi = ubicacion(router.getUbicacion());
        return armar(
                ColeccionesStock.ROUTERS,
                router.getId(),
                router.getCodigoInterno(),
                "RTR",
                motivoInfraestructura(router.getId(), "RTR", estadoTexto, ubi),
                "router",
                router.getMarca(),
                router.getModelo(),
                router.getNumeroSerie(),
                "",
                estadoTexto,
                router.getFechaAlta(),
                ubi);
    }

    public static FichaLectura desdeSwitch(SwitchRed sw) {
        String estadoTexto = estado(sw.getEstadoActual(), sw.getEstado());
        String ubi = ubicacion(sw.getUbicacion());
        return armar(
                ColeccionesStock.SWITCHES,
                sw.getId(),
                sw.getCodigoInterno(),
                "SW",
                motivoInfraestructura(sw.getId(), "SW", estadoTexto, ubi),
                "switch",
                sw.getMarca(),
                sw.getModelo(),
                sw.getNumeroSerie(),
                "",
                estadoTexto,
                sw.getFechaAlta(),
                ubi);
    }

    public static FichaLectura desdeAccessPoint(AccessPoint ap) {
        String estadoTexto = estado(null, ap.getEstado());
        String ubi = ubicacion(ap.getUbicacion());
        return armar(
                ColeccionesStock.ACCESS_POINTS,
                ap.getId(),
                ap.getCodigoInterno(),
                "AP",
                motivoInfraestructura(ap.getId(), "AP", estadoTexto, ubi),
                "access_point",
                ap.getMarca(),
                ap.getModelo(),
                "",
                "",
                estadoTexto,
                "",
                ubi);
    }

    private static FichaLectura armar(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            String motivoOmitir,
            String tipo,
            String marca,
            String modelo,
            String serieOImei,
            String condicion,
            String estadoDeposito,
            String fechaIngreso,
            String ubicacion) {
        return FichaLectura.de(
                coleccion,
                id,
                codigoInterno,
                prefijo,
                motivoOmitir != null ? motivoOmitir : motivo(id, prefijo, 1),
                tipo,
                marca,
                modelo,
                serieOImei,
                condicion,
                estadoDeposito,
                fechaIngreso,
                ubicacion,
                1);
    }

    static String motivo(String id, String prefijo, Integer cantidad) {
        if (id == null || id.isBlank()) {
            return "sin_id";
        }
        if (cantidad != null && cantidad < 0) {
            return "sin_stock";
        }
        if (prefijo == null) {
            return "tipo_desconocido";
        }
        return null;
    }

    private static String prefijoPeriferico(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return null;
        }
        return switch (tipo.trim().toLowerCase(Locale.ROOT)) {
            case "monitor" -> "MON";
            case "teclado" -> "TEC";
            case "mouse" -> "MOU";
            case "impresora" -> "IMP";
            case "webcam" -> "WEB";
            case "parlante" -> "PAR";
            case "microfono", "micrófono" -> "MIC";
            case "computadora", "pc", "desktop" -> "PC";
            case "notebook", "laptop" -> "NB";
            case "celular" -> "CEL";
            case "camara", "cámara", "camara_ip", "cámara_ip" -> "CAM";
            case "televisor" -> "TV";
            case "router" -> "RTR";
            case "switch" -> "SW";
            case "access_point", "accesspoint", "ap" -> "AP";
            case "telefono_ip", "telefono" -> "TEL";
            case "otro" -> "OTR";
            default -> null;
        };
    }

    private static String estado(Estado estadoActual, String estadoTexto) {
        if (estadoActual != null && estadoActual.getNombre() != null && !estadoActual.getNombre().isBlank()) {
            return estadoActual.getNombre();
        }
        return estadoTexto == null ? "" : estadoTexto;
    }

    private static String ubicacion(Ubicacion ubicacion) {
        Ubicacion normalizada = Ubicacion.normalizar(ubicacion);
        return normalizada == null ? "" : normalizada.name();
    }

    private static String ubicacion(UbicacionRed ubicacion) {
        return ubicacion == null ? "" : ubicacion.name();
    }
}
