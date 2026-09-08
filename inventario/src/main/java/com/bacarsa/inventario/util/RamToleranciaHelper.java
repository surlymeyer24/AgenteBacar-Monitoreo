package com.bacarsa.inventario.util;

public final class RamToleranciaHelper {

    private static final double TOLERANCIA_RELATIVA = 0.05;
    private static final double TOLERANCIA_ABSOLUTA_GB = 0.5;

    private RamToleranciaHelper() {
    }

    public static boolean coincideRam(Double esperadoGb, Double realGb) {
        if (esperadoGb == null || realGb == null || esperadoGb <= 0) {
            return false;
        }
        double diff = Math.abs(esperadoGb - realGb);
        if (diff <= TOLERANCIA_ABSOLUTA_GB) {
            return true;
        }
        if (diff / esperadoGb <= TOLERANCIA_RELATIVA) {
            return true;
        }
        return bucketNominal(esperadoGb) == bucketNominal(realGb);
    }

    public static int bucketNominal(double gb) {
        if (gb >= 3.5 && gb <= 4.5) return 4;
        if (gb >= 7.0 && gb <= 9.0) return 8;
        if (gb >= 14.5 && gb <= 17.5) return 16;
        if (gb >= 30.0 && gb <= 34.0) return 32;
        return (int) Math.round(gb);
    }
}
