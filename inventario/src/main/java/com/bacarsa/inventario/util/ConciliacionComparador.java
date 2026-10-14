package com.bacarsa.inventario.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.bacarsa.inventario.models.BaselineEsperado;
import com.bacarsa.inventario.models.BaselinePerifericoEsperado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoReporteAgente;
import com.bacarsa.inventario.models.MonitorFirestore;

import lombok.Getter;

public final class ConciliacionComparador {

    private ConciliacionComparador() {
    }

    @Getter
    public static final class ComparacionResult {
        private final EstadoReporteAgente estadoReporte;
        @Deprecated
        private final EstadoConciliacion estado;
        private final List<String> camposDiferentes;
        private final Map<String, Object> detalle;

        public ComparacionResult(EstadoReporteAgente estadoReporte, EstadoConciliacion estado,
                List<String> camposDiferentes, Map<String, Object> detalle) {
            this.estadoReporte = estadoReporte;
            this.estado = estado;
            this.camposDiferentes = camposDiferentes;
            this.detalle = detalle;
        }
    }

    public static ComparacionResult comparar(Computadora agente, BaselineEsperado baseline) {
        List<String> diffs = new ArrayList<>();
        Map<String, Object> detalle = new LinkedHashMap<>();

        if (baseline == null) {
            detalle.put("error", "Sin baseline en stock");
            return new ComparacionResult(EstadoReporteAgente.DISCREPANCIA, EstadoConciliacion.DISCREPANCIA, List.of("baseline"), detalle);
        }

        String cpuAgente = extraerCpu(agente);
        if (baseline.getCpuModelo() != null && cpuAgente != null) {
            detalle.put("cpu_esperado", baseline.getCpuModelo());
            detalle.put("cpu_real", cpuAgente);
            if (!cpusCoinciden(cpuAgente, baseline.getCpuModelo())) {
                diffs.add("cpu_modelo");
            }
        }

        if (baseline.getRamTotalGb() != null && agente.getRamTotalGb() != null) {
            detalle.put("ram_esperado_gb", baseline.getRamTotalGb());
            detalle.put("ram_real_gb", agente.getRamTotalGb());
            if (!RamToleranciaHelper.coincideRam(baseline.getRamTotalGb().doubleValue(), agente.getRamTotalGb())) {
                diffs.add("ram_total_gb");
            } else if (!baseline.getRamTotalGb().equals(agente.getRamTotalGb().intValue())) {
                detalle.put("ram_nota", "dentro de tolerancia OS");
            }
        }

        if (baseline.getDiscoResumen() != null && agente.getDiscos() != null && !agente.getDiscos().isEmpty()) {
            String discoAgente = BaselineNormalizacionHelper.normalizarTextoHw(
                    agente.getDiscos().get(0).getModeloDisco());
            detalle.put("disco_esperado", baseline.getDiscoResumen());
            detalle.put("disco_real", discoAgente);
            if (discoAgente != null && !discoAgente.contains(baseline.getDiscoResumen())
                    && !baseline.getDiscoResumen().contains(discoAgente)) {
                diffs.add("disco_resumen");
            }
        }

        compararMonitor(agente, baseline, diffs, detalle);

        EstadoReporteAgente reporte = diffs.isEmpty() ? EstadoReporteAgente.CONFIRMADA : EstadoReporteAgente.DISCREPANCIA;
        EstadoConciliacion estado = diffs.isEmpty() ? EstadoConciliacion.COINCIDE : EstadoConciliacion.DISCREPANCIA;
        return new ComparacionResult(reporte, estado, diffs, detalle);
    }

    private static void compararMonitor(Computadora agente, BaselineEsperado baseline,
            List<String> diffs, Map<String, Object> detalle) {
        BaselinePerifericoEsperado monitorBaseline = baseline.getPerifericos() == null ? null
                : baseline.getPerifericos().stream()
                        .filter(p -> "monitor".equalsIgnoreCase(p.getTipo()))
                        .findFirst().orElse(null);
        if (monitorBaseline == null) {
            return;
        }
        MonitorFirestore monitorAgente = agente.getPerifericos() != null
                && agente.getPerifericos().getMonitores() != null
                && !agente.getPerifericos().getMonitores().isEmpty()
                ? agente.getPerifericos().getMonitores().get(0) : null;
        if (monitorAgente == null) {
            diffs.add("monitor");
            detalle.put("monitor_esperado", monitorBaseline.getNombre());
            detalle.put("monitor_real", null);
            return;
        }

        String serialA = SerialPerifericoHelper.normalizarSerial(monitorAgente.getNumeroSerie());
        String serialS = SerialPerifericoHelper.normalizarSerial(monitorBaseline.getNumeroSerie());
        detalle.put("monitor_esperado", monitorBaseline.getNombre());
        detalle.put("monitor_real", monitorAgente.getNombre());
        if (serialA != null && serialS != null && !serialA.equals(serialS)) {
            diffs.add("monitor_serial");
            return;
        }
        if (serialA == null || serialS == null) {
            String fabA = monitorAgente.getFabricante();
            String fabS = monitorBaseline.getFabricante();
            if (fabA != null && fabS != null && !fabA.equalsIgnoreCase(fabS)) {
                diffs.add("monitor_marca_modelo");
                detalle.put("monitor_nota", "Match parcial por modelo; validar manualmente");
            }
        }
    }

    private static String extraerCpu(Computadora agente) {
        if (agente.getProcesadorDetallado() != null && agente.getProcesadorDetallado().getModelo() != null) {
            return BaselineNormalizacionHelper.normalizarTextoHw(agente.getProcesadorDetallado().getModelo());
        }
        return BaselineNormalizacionHelper.normalizarTextoHw(agente.getProcesadorRaw());
    }

    private static boolean cpusCoinciden(String a, String b) {
        if (a == null || b == null) return false;
        return a.equals(b) || a.contains(b) || b.contains(a);
    }
}
