package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@ExtendWith(MockitoExtension.class)
class StockUnidadesServiceTest {

    @Mock
    private PerifericoManualRepository perifericoManualRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private ComputadoraRepository computadoraRepository;

    private StockUnidadesService service;

    @BeforeEach
    void setUp() {
        service = new StockUnidadesService(perifericoManualRepository, celularRepository, computadoraRepository);
    }

    @Test
    void elGetNoEscribe() throws Exception {
        PerifericoManual p = item("p-1", "TEC-1", "teclado");
        when(perifericoManualRepository.findAll()).thenReturn(List.of(p));

        assertEquals(1, service.listar().size());
        assertEquals("TEC-1", service.listar().get(0).getCodigo());

        verify(perifericoManualRepository, never()).mergeCodigoInterno(anyString(), anyString());
    }

    @Test
    void listar_incluyeCelularesEnStock() throws Exception {
        Celular cel = new Celular();
        cel.setId("cel-1");
        cel.setCodigoInterno("CEL-10");
        cel.setMarca("Samsung");
        cel.setModelo("Galaxy A54");
        cel.setImei("352000000000001");
        cel.setEstado("en_stock");

        when(celularRepository.findAll()).thenReturn(List.of(cel));

        assertEquals(1, service.listar().size());
        assertEquals("CEL-10", service.listar().get(0).getCodigo());
        assertEquals("celular", service.listar().get(0).getTipo());
        assertEquals("Samsung", service.listar().get(0).getMarca());
        assertEquals("Galaxy A54", service.listar().get(0).getModelo());
    }

    @Test
    void elBackfillEscribeSoloElCampoCodigoEnLaFichaSinCodigo() throws Exception {
        PerifericoManual yaTiene = item("p-vieja", "TEC-7", "teclado");
        PerifericoManual falta = item("p-nueva", null, "teclado");
        when(perifericoManualRepository.findAll()).thenReturn(List.of(yaTiene, falta));

        service.backfill();

        verify(perifericoManualRepository, times(1)).mergeCodigoInterno("p-nueva", "TEC-8");
        verify(perifericoManualRepository, never()).mergeCodigoInterno("p-vieja", "TEC-7");
    }

    @Test
    void siFallaLecturaRetornaVacio() throws Exception {
        when(perifericoManualRepository.findAll()).thenThrow(new ExecutionException("caida", null));

        assertTrue(service.listar().isEmpty());
    }

    private static PerifericoManual item(String id, String codigo, String tipo) {
        PerifericoManual p = new PerifericoManual();
        p.setId(id);
        p.setCodigoInterno(codigo);
        p.setTipo(tipo);
        p.setCantidad(1);
        return p;
    }
}
