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
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.StockFichaRepository;
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
    @Mock
    private StockFichaRepository stockFichaRepository;

    private StockUnidadesService service;

    @BeforeEach
    void setUp() {
        service = new StockUnidadesService(perifericoManualRepository, celularRepository, computadoraRepository, stockFichaRepository);
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
        cel.setCondicion("NUEVO");
        cel.setArea("Sistemas");
        cel.setEstado("en_stock");

        when(celularRepository.findAll()).thenReturn(List.of(cel));

        assertEquals(1, service.listar().size());
        assertEquals("CEL-10", service.listar().get(0).getCodigo());
        assertEquals("celular", service.listar().get(0).getTipo());
        assertEquals("Samsung", service.listar().get(0).getMarca());
        assertEquals("Galaxy A54", service.listar().get(0).getModelo());
        assertEquals("NUEVO", service.listar().get(0).getCondicion());
        assertEquals("Sistemas", service.listar().get(0).getUbicacion());
    }

    @Test
    void listar_conStockFichas_retornaFichasDirectamente() throws Exception {
        StockFicha ficha = StockFicha.builder()
                .codigoInterno("PC-100")
                .tipo("DESKTOP")
                .descripcion("Core i5 · 16 GB RAM · 512 GB SSD")
                .estado("EN_DEPOSITO")
                .ubicacion("DEPOSITO CENTRAL")
                .condicion("USADA")
                .build();

        when(stockFichaRepository.findAll()).thenReturn(List.of(ficha));

        var items = service.listar();
        assertEquals(1, items.size());
        assertEquals("PC-100", items.get(0).getCodigo());
        assertEquals("desktop", items.get(0).getTipo());
        assertEquals("DEPOSITO CENTRAL", items.get(0).getUbicacion());
        assertEquals("Core i5 · 16 GB RAM · 512 GB SSD", items.get(0).getDescripcionCompleta());
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

    private static Estado crearEstado(String nombre) {
        Estado e = new Estado();
        e.setNombre(nombre);
        return e;
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
