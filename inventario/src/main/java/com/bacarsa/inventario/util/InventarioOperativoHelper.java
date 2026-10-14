package com.bacarsa.inventario.util;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EspecificacionStock;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoPreparacion;
import com.bacarsa.inventario.models.OrigenAlta;

/**
 * Separa inventario operativo (agente / campo) de unidades en depósito (stock).
 */
public final class InventarioOperativoHelper {

    private InventarioOperativoHelper() {
    }

    public static boolean esPcVisibleEnInventario(Computadora pc) {
        return !esUnidadStockEnDeposito(pc);
    }

    public static boolean esUnidadStockEnDeposito(Computadora pc) {
        if (pc == null || pc.getUuid() == null || pc.getUuid().isBlank()) {
            return false;
        }
        if (!esEstadoSinAsignar(pc)) {
            return false;
        }
        OrigenAlta origen = pc.getOrigenAlta();
        if (origen == OrigenAlta.DETECTADA_POR_AGENTE || origen == OrigenAlta.DETECTADA_VINCULADA_RETRO) {
            return false;
        }
        if (esPreparacionNoAplica(pc)) {
            return false;
        }
        if (origen == OrigenAlta.STOCK || tieneTexto(pc.getLoteOrigenId())) {
            return true;
        }
        return sinReporteAgente(pc)
                && (tieneEspecificacionStock(pc) || tieneTexto(pc.getDescripcionStock()));
    }

    public static boolean esPcPipelineStock(Computadora pc) {
        if (pc == null || pc.getUuid() == null || pc.getUuid().isBlank()) {
            return false;
        }
        if (esPreparacionNoAplica(pc)) {
            return false;
        }
        if (pc.getOrigenAlta() == OrigenAlta.STOCK || tieneTexto(pc.getLoteOrigenId())) {
            return true;
        }
        return esEstadoSinAsignar(pc);
    }

    /** Escape hatch: está en el tablero o clasificada como stock en depósito. */
    public static boolean puedeSacarDePipeline(Computadora pc) {
        return esPcPipelineStock(pc) || esUnidadStockEnDeposito(pc);
    }

    private static boolean esPreparacionNoAplica(Computadora pc) {
        return pc.getEstadoPreparacion() == EstadoPreparacion.NO_APLICA;
    }

    private static boolean esEstadoSinAsignar(Computadora pc) {
        Estado estado = pc.getEstadoActual();
        if (estado == null || estado.getNombre() == null || estado.getNombre().isBlank()) {
            return true;
        }
        String n = estado.getNombre().trim().replace(' ', '_').toUpperCase();
        return "SIN_ASIGNAR".equals(n);
    }

    private static boolean sinReporteAgente(Computadora pc) {
        return pc.getUltimaSincronizacion() == null;
    }

    private static boolean tieneEspecificacionStock(Computadora pc) {
        EspecificacionStock spec = pc.getEspecificacionEsperada();
        if (spec == null) {
            return false;
        }
        return tieneTexto(spec.getCpuModelo())
                || spec.getRamTotalGb() != null && spec.getRamTotalGb() > 0
                || tieneTexto(spec.getDiscoResumen());
    }

    private static boolean tieneTexto(String value) {
        return value != null && !value.isBlank();
    }
}
