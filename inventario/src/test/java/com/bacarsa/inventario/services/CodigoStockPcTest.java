package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

class CodigoStockPcTest {

    @Test
    void prefijoNotebookEsNbYCualquierOtroPc() {
        assertEquals("NB", CodigoStockPc.prefijo("notebook"));
        assertEquals("NB", CodigoStockPc.prefijo("Laptop"));
        assertEquals("PC", CodigoStockPc.prefijo("desktop"));
        assertEquals("PC", CodigoStockPc.prefijo(null));
        assertEquals("PC", CodigoStockPc.prefijo(""));
    }

    @Test
    void siguienteIgnoraHostnamesYOtrosPrefijos() {
        List<String> existentes = List.of("MARCE-SANTUCHO", "PC-3", "PC-10", "NB-20", "MON-50");
        assertEquals("PC-11", CodigoStockPc.siguiente("PC", existentes, c -> false));
        assertEquals("NB-21", CodigoStockPc.siguiente("NB", existentes, c -> false));
    }

    @Test
    void siguienteArrancaEnUnoSinCodigos() {
        assertEquals("PC-1", CodigoStockPc.siguiente("PC", List.of("MARCE-SANTUCHO"), null));
    }

    @Test
    void siguienteSaltaCodigosOcupadosEnComputadoras() {
        Set<String> ocupados = Set.of("PC-4", "PC-5");
        assertEquals("PC-6", CodigoStockPc.siguiente("PC", List.of("PC-3"), ocupados::contains));
    }

    @Test
    void esCodigoValidoDistingueHostname() {
        assertTrue(CodigoStockPc.esCodigoValido("PC-12"));
        assertFalse(CodigoStockPc.esCodigoValido("MARCE-SANTUCHO"));
    }
}
