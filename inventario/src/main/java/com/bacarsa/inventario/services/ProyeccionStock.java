package com.bacarsa.inventario.services;

import java.util.Locale;

import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
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
        String tipo = "";
        if (tipoRaw != null && tipoRaw.toLowerCase(Locale.ROOT).contains("notebook")) {
            prefijo = "NB";
            tipo = "notebook";
        } else if (tipoRaw != null && "desktop".equalsIgnoreCase(tipoRaw.trim())) {
            prefijo = "PC";
            tipo = "desktop";
        }
        return armar(
                ColeccionesStock.COMPUTADORAS,
                computadora.getUuid(),
                computadora.getCodigoInterno(),
                prefijo,
                null,
                tipo,
                "",
                "",
                computadora.getSerialEquipo(),
                computadora.getCondicion(),
                estado(computadora.getEstadoActual(), null),
                "",
                ubicacion(computadora.getUbicacion()));
    }

    public static FichaLectura desdePeriferico(PerifericoManual periferico) {
        String prefijo = prefijoPeriferico(periferico.getTipo());
        String tipo = prefijo == null ? "" : periferico.getTipo().trim().toLowerCase(Locale.ROOT);
        return armar(
                ColeccionesStock.PERIFERICOS_MANUALES,
                periferico.getId(),
                periferico.getCodigoInterno(),
                prefijo,
                periferico.getCantidad(),
                tipo,
                periferico.getFabricante(),
                "",
                periferico.getNumeroSerie(),
                "",
                estado(periferico.getEstadoActual(), null),
                periferico.getFechaAlta(),
                periferico.getUbicacion());
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

    public static FichaLectura desdeRouter(Router router) {
        return armar(
                ColeccionesStock.ROUTERS,
                router.getId(),
                router.getCodigoInterno(),
                "RTR",
                null,
                "router",
                router.getMarca(),
                router.getModelo(),
                router.getNumeroSerie(),
                "",
                estado(router.getEstadoActual(), router.getEstado()),
                router.getFechaAlta(),
                ubicacion(router.getUbicacion()));
    }

    public static FichaLectura desdeSwitch(SwitchRed sw) {
        return armar(
                ColeccionesStock.SWITCHES,
                sw.getId(),
                sw.getCodigoInterno(),
                "SW",
                null,
                "switch",
                sw.getMarca(),
                sw.getModelo(),
                sw.getNumeroSerie(),
                "",
                estado(sw.getEstadoActual(), sw.getEstado()),
                sw.getFechaAlta(),
                ubicacion(sw.getUbicacion()));
    }

    public static FichaLectura desdeAccessPoint(AccessPoint ap) {
        return armar(
                ColeccionesStock.ACCESS_POINTS,
                ap.getId(),
                ap.getCodigoInterno(),
                "AP",
                null,
                "access_point",
                ap.getMarca(),
                ap.getModelo(),
                "",
                "",
                estado(null, ap.getEstado()),
                "",
                ubicacion(ap.getUbicacion()));
    }

    private static FichaLectura armar(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            Integer cantidad,
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
                motivo(id, prefijo, cantidad),
                tipo,
                marca,
                modelo,
                serieOImei,
                condicion,
                estadoDeposito,
                fechaIngreso,
                ubicacion);
    }

    static String motivo(String id, String prefijo, Integer cantidad) {
        if (id == null || id.isBlank()) {
            return "sin_id";
        }
        if (cantidad != null && cantidad != 1) {
            return "cantidad_distinta_de_1";
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
            case "microfono" -> "MIC";
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
