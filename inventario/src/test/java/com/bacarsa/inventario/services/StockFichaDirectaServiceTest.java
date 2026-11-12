package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.AsignarUnidadStockDTO;
import com.bacarsa.inventario.dto.DevolverUnidadStockDTO;
import com.bacarsa.inventario.dto.MovimientoStockDTO;
import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;

@ExtendWith(MockitoExtension.class)
class StockFichaDirectaServiceTest {

    @Mock
    private StockFichaRepository stockFichaRepository;
    @Mock
    private MovimientoStockRepository movimientoStockRepository;
    @Mock
    private PerifericoManualRepository perifericoManualRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private ComputadoraRepository computadoraRepository;
    @Mock
    private AccessPointRepository accessPointRepository;

    private StockUnidadesService unidadesService;
    private StockAsignacionesService asignacionesService;

    @BeforeEach
    void setUp() {
        unidadesService = new StockUnidadesService(
                perifericoManualRepository,
                celularRepository,
                computadoraRepository,
                stockFichaRepository);

        asignacionesService = new StockAsignacionesService(
                movimientoStockRepository,
                unidadesService,
                perifericoManualRepository,
                computadoraRepository,
                celularRepository,
                accessPointRepository,
                stockFichaRepository);
    }

    @Test
    void unidadesService_listar_leeDirectoDeStockFichas() throws Exception {
        StockFicha f1 = StockFicha.builder()
                .codigoInterno("NB-0042")
                .tipo("NOTEBOOK")
                .descripcion("Lenovo ThinkPad L14 Gen3")
                .marca("Lenovo")
                .modelo("ThinkPad L14 Gen3")
                .serieOImei("PF123456")
                .estado("EN_DEPOSITO")
                .ubicacion("Depósito Sistemas")
                .condicion("USADA")
                .build();

        when(stockFichaRepository.findAll()).thenReturn(List.of(f1));

        List<UnidadStockDTO> resultado = unidadesService.listar();

        assertEquals(1, resultado.size());
        assertEquals("NB-0042", resultado.get(0).getCodigo());
        assertEquals("EN_DEPOSITO", resultado.get(0).getEstadoDeposito());
        assertEquals("Lenovo ThinkPad L14 Gen3", resultado.get(0).getDescripcionCompleta());
    }

    @Test
    void asignacionesService_listar_filtraSoloFichasAsignadas() throws Exception {
        StockFicha f1 = StockFicha.builder()
                .codigoInterno("NB-0042")
                .tipo("NOTEBOOK")
                .marca("Lenovo")
                .modelo("ThinkPad L14 Gen3")
                .estado("ASIGNADA")
                .responsableNombre("Juan Perez")
                .area("Tesorería")
                .build();

        StockFicha f2 = StockFicha.builder()
                .codigoInterno("NB-0043")
                .tipo("NOTEBOOK")
                .estado("EN_DEPOSITO")
                .build();

        when(stockFichaRepository.findAll()).thenReturn(List.of(f1, f2));

        List<MovimientoStockDTO> resultado = asignacionesService.listar();

        assertEquals(1, resultado.size());
        assertEquals("NB-0042", resultado.get(0).getCodigo());
        assertEquals("Juan Perez", resultado.get(0).getResponsable());
        assertEquals("Tesorería", resultado.get(0).getArea());
    }

    @Test
    void asignacionesService_listarMovimientosPorCodigo_devuelveHistorialOrdenado() throws Exception {
        MovimientoStock m1 = new MovimientoStock();
        m1.setId("m1");
        m1.setFichaCodigo("NB-0042");
        m1.setCodigo("NB-0042");
        m1.setAccion("Asignación");
        m1.setFecha("2026-02-01 10:00:00");

        MovimientoStock m2 = new MovimientoStock();
        m2.setId("m2");
        m2.setFichaCodigo("NB-0042");
        m2.setCodigo("NB-0042");
        m2.setAccion("Devolución");
        m2.setFecha("2026-03-01 12:00:00");

        when(movimientoStockRepository.findAll()).thenReturn(List.of(m1, m2));

        List<MovimientoStockDTO> historial = asignacionesService.listarMovimientosPorCodigo("NB-0042");

        assertEquals(2, historial.size());
        assertEquals("2026-03-01 12:00:00", historial.get(0).getFecha());
        assertEquals("2026-02-01 10:00:00", historial.get(1).getFecha());
    }

    private StockFicha lote(int cantidad) {
        return StockFicha.builder()
                .codigoInterno("TEC-0010")
                .tipo("TECLADO")
                .descripcion("Teclado Logitech")
                .marca("Logitech")
                .modelo("K120")
                .estado("EN_DEPOSITO")
                .ubicacion("Depósito Sistemas")
                .condicion("NUEVA")
                .refOrigen("perifericos_manuales/abc")
                .cantidad(cantidad)
                .build();
    }

    @Test
    void asignar_parcialDeLote_descuentaLoteYCreaFichaHijaConTrazabilidad() throws Exception {
        StockFicha lote = lote(10);
        when(stockFichaRepository.findById("TEC-0010")).thenReturn(lote);
        when(stockFichaRepository.findAll()).thenReturn(List.of(lote));

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Juan Perez")
                .area("Tesorería")
                .cantidad(3)
                .build();

        MovimientoStockDTO res = asignacionesService.asignar("TEC-0010", dto, "usr");

        assertEquals("Activa", res.getEstado());
        assertEquals(3, res.getCantidad());
        assertEquals("TEC-0010", res.getLoteOrigen());
        assertEquals("TEC-0010-A1", res.getCodigo());
        assertEquals(7, lote.getCantidad());

        ArgumentCaptor<StockFicha> captor = ArgumentCaptor.forClass(StockFicha.class);
        verify(stockFichaRepository, org.mockito.Mockito.times(2)).save(captor.capture());
        StockFicha hija = captor.getAllValues().get(0);
        assertEquals("TEC-0010-A1", hija.getCodigoInterno());
        assertEquals("ASIGNADA", hija.getEstado());
        assertEquals(3, hija.getCantidad());
        assertEquals("TEC-0010", hija.getLoteOrigen());
        assertEquals("Juan Perez", hija.getResponsableNombre());
    }

    @Test
    void asignar_masDeLoDisponible_falla() throws Exception {
        StockFicha lote = lote(2);
        when(stockFichaRepository.findById("TEC-0010")).thenReturn(lote);

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Juan Perez")
                .cantidad(5)
                .build();

        assertThrows(IllegalArgumentException.class, () -> asignacionesService.asignar("TEC-0010", dto, "usr"));
        verify(stockFichaRepository, never()).save(any());
    }

    @Test
    void devolver_parcialDeFichaHija_reintegraAlLote() throws Exception {
        StockFicha lote = lote(7);
        StockFicha hija = StockFicha.builder()
                .codigoInterno("TEC-0010-A1")
                .tipo("TECLADO")
                .estado("ASIGNADA")
                .responsableNombre("Juan Perez")
                .area("Tesorería")
                .cantidad(3)
                .loteOrigen("TEC-0010")
                .build();
        when(stockFichaRepository.findById("TEC-0010-A1")).thenReturn(hija);
        when(stockFichaRepository.findById("TEC-0010")).thenReturn(lote);

        DevolverUnidadStockDTO dto = DevolverUnidadStockDTO.builder().cantidad(1).build();
        MovimientoStockDTO res = asignacionesService.devolver("TEC-0010-A1", dto, "usr");

        assertEquals(1, res.getCantidad());
        assertEquals("TEC-0010", res.getLoteOrigen());
        assertEquals(8, lote.getCantidad());
        assertEquals(2, hija.getCantidad());
        assertEquals("ASIGNADA", hija.getEstado());
    }

    @Test
    void devolver_totalDeFichaHija_cierraLaAsignacion() throws Exception {
        StockFicha lote = lote(7);
        StockFicha hija = StockFicha.builder()
                .codigoInterno("TEC-0010-A1")
                .tipo("TECLADO")
                .estado("ASIGNADA")
                .responsableNombre("Juan Perez")
                .cantidad(3)
                .loteOrigen("TEC-0010")
                .build();
        when(stockFichaRepository.findById("TEC-0010-A1")).thenReturn(hija);
        when(stockFichaRepository.findById("TEC-0010")).thenReturn(lote);

        asignacionesService.devolver("TEC-0010-A1", DevolverUnidadStockDTO.builder().build(), "usr");

        assertEquals(10, lote.getCantidad());
        assertEquals(0, hija.getCantidad());
        assertEquals("DEVUELTA", hija.getEstado());
        assertTrue(hija.getResponsableNombre() == null);
    }

    @Test
    void historialDelLote_incluyeMovimientosDeSusFichasHijas() throws Exception {
        MovimientoStock m = new MovimientoStock();
        m.setId("m1");
        m.setCodigo("TEC-0010-A1");
        m.setFichaCodigo("TEC-0010-A1");
        m.setLoteOrigen("TEC-0010");
        m.setCantidad(3);
        m.setFecha("2026-02-01 10:00:00");
        when(movimientoStockRepository.findAll()).thenReturn(List.of(m));

        List<MovimientoStockDTO> historial = asignacionesService.listarMovimientosPorCodigo("TEC-0010");

        assertEquals(1, historial.size());
        assertEquals(3, historial.get(0).getCantidad());
    }

    @Test
    void asignar_parcialDeLoteLegacy_descuentaCantidadSinMarcarLoteComoAsignado() throws Exception {
        com.bacarsa.inventario.models.PerifericoManual pm = new com.bacarsa.inventario.models.PerifericoManual();
        pm.setId("gZqgHQEswK4eptVrYaPv");
        pm.setCodigoInterno("PC-4");
        pm.setTipo("computadora");
        pm.setNombre("PC Clon");
        pm.setCantidad(2);
        pm.setUbicacion("DEPOSITO");
        com.bacarsa.inventario.models.Estado est = new com.bacarsa.inventario.models.Estado();
        est.setNombre("SIN_ASIGNAR");
        pm.setEstadoActual(est);

        when(stockFichaRepository.findById("PC-4")).thenReturn(null);
        when(perifericoManualRepository.findAll()).thenReturn(List.of(pm));

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Surly Test")
                .area("SISTEMAS")
                .cantidad(1)
                .build();

        MovimientoStockDTO res = asignacionesService.asignar("PC-4", dto, "usr");

        assertEquals("Activa", res.getEstado());
        assertEquals("PC-4-A1", res.getCodigo());
        assertEquals("PC-4", res.getLoteOrigen());
        assertEquals(1, res.getCantidad());
        verify(perifericoManualRepository).actualizar(
                org.mockito.Mockito.eq("gZqgHQEswK4eptVrYaPv"),
                argThat(map -> Integer.valueOf(1).equals(map.get("cantidad")) && !map.containsKey("estadoActual")));
    }
}
