package com.bacarsa.inventario.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private int totalComputadoras;
    private int totalCamaras;
    /** Suma de impresoras, USB, monitores y dispositivos de audio (entrada/salida) en todas las PCs. */
    private int totalPerifericos;
    /** Conteos por tipo (Impresoras, Monitores, Teclados, …) alineados al inventario front. */
    private Map<String, Integer> perifericosPorTipo;
    /**
     * Equipos con última sync dentro del umbral “activo” (ciclo agente ~5 min + margen; ver DashboardService).
     * Nombre JSON histórico: computadorasSyncMenos10Min.
     */
    private int computadorasSyncMenos10Min;
    /** Sin fecha de sync o última sync hace más de 1 hora. */
    private int computadorasSinActividadMas1h;
    /** Última sync en zona intermedia (por encima del umbral activo y hasta 1 h). */
    private int computadorasSyncEntre10MinY1h;
    private int computadorasConectadas;
    private int computadorasDesconectadas;
    private Map<String, Integer> porEstadoComputadoras;
    private Map<String, Integer> porEstadoCamaras;
    private Map<String, Integer> porUbicacionComputadoras;
    private Map<String, Integer> porUbicacionCamaras;
    private int totalRouters;
    private int totalSwitches;
    private int totalAccessPoints;
    private Map<String, Integer> porEstadoRouters;
    private Map<String, Integer> porEstadoSwitches;
    private Map<String, Integer> porUbicacionRouters;
    private Map<String, Integer> porUbicacionSwitches;
    private List<CambioRecienteDTO> ultimosCambios;
    private int totalTelefonos;
    private int totalNotebooks;
    private int totalDesktops;
    private int stockPcsSinAsignar;
}
