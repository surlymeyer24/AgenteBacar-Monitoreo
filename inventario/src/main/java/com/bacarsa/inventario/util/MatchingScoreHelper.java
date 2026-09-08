package com.bacarsa.inventario.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.bacarsa.inventario.models.BaselineEsperado;
import com.bacarsa.inventario.models.BaselinePerifericoEsperado;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.MonitorFirestore;

import lombok.Getter;

public final class MatchingScoreHelper {

    public static final int UMBRAL_SUGERENCIA = 40;
    public static final int UMBRAL_ALTA_CONFIANZA = 70;

    private MatchingScoreHelper() {
    }

    @Getter
    public static final class ScoreResult {
        private final int score;
        private final List<String> camposCoincidentes;
        private final List<String> camposDiferentes;
        private final List<String> notasMatch;

        public ScoreResult(int score, List<String> camposCoincidentes,
                List<String> camposDiferentes, List<String> notasMatch) {
            this.score = score;
            this.camposCoincidentes = camposCoincidentes;
            this.camposDiferentes = camposDiferentes;
            this.notasMatch = notasMatch;
        }
    }

    public static ScoreResult calcular(Computadora agente, Computadora stock) {
        List<String> coincidentes = new ArrayList<>();
        List<String> diferentes = new ArrayList<>();
        List<String> notas = new ArrayList<>();
        int score = 0;

        score += puntearIdentidad(agente.getAssetTag(), stock.getAssetTag(), "asset_tag", coincidentes, diferentes, 50);
        score += puntearIdentidad(agente.getSerialEquipo(), stock.getSerialEquipo(), "serial_equipo", coincidentes, diferentes, 50);
        score += puntearIdentidad(agente.getMotherboardSerial(), stock.getMotherboardSerial(), "motherboard_serial", coincidentes, diferentes, 30);
        score += puntearIdentidad(agente.getBiosUuid(), stock.getBiosUuid(), "bios_uuid", coincidentes, diferentes, 30);
        score += puntearIdentidad(agente.getMacPrincipal(), stock.getMacPrincipal(), "mac_principal", coincidentes, diferentes, 20);

        String cpuAgente = extraerCpu(agente);
        BaselineEsperado baseline = stock.getBaselineEsperado();
        String cpuStock = baseline != null ? baseline.getCpuModelo() : null;
        if (cpuAgente != null && cpuStock != null) {
            if (cpusCoinciden(cpuAgente, cpuStock)) {
                score += 15;
                coincidentes.add("cpu_modelo");
            } else {
                diferentes.add("cpu_modelo");
            }
        }

        Double ramAgente = agente.getRamTotalGb();
        Integer ramStock = baseline != null ? baseline.getRamTotalGb() : null;
        if (ramAgente != null && ramStock != null) {
            if (RamToleranciaHelper.coincideRam(ramStock.doubleValue(), ramAgente)) {
                score += 10;
                coincidentes.add("ram_total_gb");
            } else {
                diferentes.add("ram_total_gb");
            }
        }

        score += puntearMonitor(agente, baseline, coincidentes, diferentes, notas);

        return new ScoreResult(Math.min(score, 100), coincidentes, diferentes, notas);
    }

    private static int puntearIdentidad(String agenteVal, String stockVal, String campo,
            List<String> coincidentes, List<String> diferentes, int peso) {
        String a = SerialPerifericoHelper.esIdentidadFuerteValida(agenteVal)
                ? agenteVal.trim().toLowerCase(Locale.ROOT) : null;
        String s = SerialPerifericoHelper.esIdentidadFuerteValida(stockVal)
                ? stockVal.trim().toLowerCase(Locale.ROOT) : null;
        if (a == null || s == null) {
            return 0;
        }
        if (a.equals(s)) {
            coincidentes.add(campo);
            return peso;
        }
        diferentes.add(campo);
        return 0;
    }

    private static int puntearMonitor(Computadora agente, BaselineEsperado baseline,
            List<String> coincidentes, List<String> diferentes, List<String> notas) {
        if (baseline == null || baseline.getPerifericos() == null) {
            return 0;
        }
        BaselinePerifericoEsperado monitorBaseline = baseline.getPerifericos().stream()
                .filter(p -> "monitor".equalsIgnoreCase(p.getTipo()))
                .findFirst()
                .orElse(null);
        if (monitorBaseline == null) {
            return 0;
        }
        MonitorFirestore monitorAgente = primerMonitor(agente);
        if (monitorAgente == null) {
            return 0;
        }

        String serialA = SerialPerifericoHelper.normalizarSerial(monitorAgente.getNumeroSerie());
        String serialS = SerialPerifericoHelper.normalizarSerial(monitorBaseline.getNumeroSerie());
        if (serialA != null && serialS != null) {
            if (serialA.equals(serialS)) {
                coincidentes.add("monitor_serial");
                return 10;
            }
            diferentes.add("monitor_serial");
            return 0;
        }

        if (marcaModeloCoinciden(monitorAgente, monitorBaseline)) {
            coincidentes.add("monitor_marca_modelo");
            notas.add("Match por marca/modelo (serial no disponible en agente o stock)");
            return 5;
        }
        diferentes.add("monitor_marca_modelo");
        return 0;
    }

    private static boolean marcaModeloCoinciden(MonitorFirestore agente, BaselinePerifericoEsperado stock) {
        String fabA = normalizarMarca(agente.getFabricante());
        String fabS = normalizarMarca(stock.getFabricante());
        String nomA = normalizarMarca(agente.getNombre());
        String nomS = normalizarMarca(stock.getNombre());
        if (fabA != null && fabS != null && fabA.equals(fabS)) {
            if (nomA != null && nomS != null && (nomA.contains(nomS) || nomS.contains(nomA))) {
                return true;
            }
            if (nomA == null && nomS == null) {
                return true;
            }
        }
        if (nomA != null && nomS != null && nomA.equals(nomS)) {
            return true;
        }
        return false;
    }

    private static String normalizarMarca(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toLowerCase(Locale.ROOT)
                .replace("lg electronics", "lg")
                .replaceAll("\\s+", " ");
    }

    private static MonitorFirestore primerMonitor(Computadora agente) {
        if (agente.getPerifericos() == null || agente.getPerifericos().getMonitores() == null
                || agente.getPerifericos().getMonitores().isEmpty()) {
            return null;
        }
        return agente.getPerifericos().getMonitores().get(0);
    }

    private static String extraerCpu(Computadora agente) {
        if (agente.getProcesadorDetallado() != null && agente.getProcesadorDetallado().getModelo() != null) {
            return BaselineNormalizacionHelper.normalizarTextoHw(agente.getProcesadorDetallado().getModelo());
        }
        return BaselineNormalizacionHelper.normalizarTextoHw(agente.getProcesadorRaw());
    }

    private static boolean cpusCoinciden(String cpuAgente, String cpuStock) {
        if (cpuAgente == null || cpuStock == null) {
            return false;
        }
        if (cpuAgente.equals(cpuStock)) {
            return true;
        }
        return cpuAgente.contains(cpuStock) || cpuStock.contains(cpuAgente);
    }
}
