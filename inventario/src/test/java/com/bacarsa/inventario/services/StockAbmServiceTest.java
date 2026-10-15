package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.AltaUnidadStockDTO;
import com.bacarsa.inventario.dto.BajaUnidadStockDTO;
import com.bacarsa.inventario.dto.ModificarUnidadStockDTO;
import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@ExtendWith(MockitoExtension.class)
class StockAbmServiceTest {

    @Mock
    private StockUnidadesService stockUnidadesService;
    @Mock
    private ComputadoraHistorialService computadoraHistorialService;
    @Mock
    private PerifericoManualRepository perifericoManualRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private CamaraRepository camaraRepository;
    @Mock
    private TelevisorRepository televisorRepository;
    @Mock
    private RouterRepository routerRepository;
    @Mock
    private SwitchRedRepository switchRedRepository;
    @Mock
    private AccessPointRepository accessPointRepository;

    private StockAbmService service;

    @BeforeEach
    void setUp() {
        service = new StockAbmService(
                stockUnidadesService,
                computadoraHistorialService,
                perifericoManualRepository,
                celularRepository,
                camaraRepository,
                televisorRepository,
                routerRepository,
                switchRedRepository,
                accessPointRepository);
    }

    @Test
    void prefijosValidosYSiguienteCodigo() {
        assertEquals("PC", StockAbmService.prefijoParaTipo("desktop"));
        assertEquals("NB", StockAbmService.prefijoParaTipo("notebook"));
        assertEquals("MON", StockAbmService.prefijoParaTipo("monitor"));
        assertEquals("TEC", StockAbmService.prefijoParaTipo("teclado"));
        assertEquals("CEL", StockAbmService.prefijoParaTipo("celular"));
        assertEquals("CAM", StockAbmService.prefijoParaTipo("camara"));
        assertEquals("TV", StockAbmService.prefijoParaTipo("televisor"));
        assertEquals("RTR", StockAbmService.prefijoParaTipo("router"));
        assertEquals("SW", StockAbmService.prefijoParaTipo("switch"));
        assertEquals("AP", StockAbmService.prefijoParaTipo("access_point"));

        assertThrows(IllegalArgumentException.class, () -> StockAbmService.prefijoParaTipo("desconocido"));
        assertThrows(IllegalArgumentException.class, () -> StockAbmService.prefijoParaTipo(""));
    }

    @Test
    void altaComputadoraUsaHistorialYSetMerge() throws Exception {
        when(stockUnidadesService.leerFichas()).thenReturn(List.of());

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("PC-1");
        esperado.setTipo("desktop");
        when(stockUnidadesService.obtenerPorCodigo("PC-1")).thenReturn(esperado);

        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("desktop");
        dto.setSerieOImei("SN-123");
        dto.setCondicion("nuevo");
        dto.setUbicacion("DEPOSITO");
        dto.setMotivo("Ingreso a stock");

        UnidadStockDTO resultado = service.alta(dto, "user-1");

        assertNotNull(resultado);
        assertEquals("PC-1", resultado.getCodigo());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> cuerpoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(computadoraHistorialService).altaManual(anyString(), cuerpoCaptor.capture(), eq("Ingreso a stock"), eq("user-1"));

        Map<String, Object> cuerpo = cuerpoCaptor.getValue();
        assertEquals("PC-1", cuerpo.get("codigo_interno"));
        assertEquals("desktop", cuerpo.get("tipoEquipo"));
        assertEquals("SN-123", cuerpo.get("serialEquipo"));
        assertEquals("DEPOSITO", cuerpo.get("ubicacion"));
        assertEquals("nuevo", cuerpo.get("condicion"));
    }

    @Test
    void altaCelularGeneraCodigoYPersisteConSetMerge() throws Exception {
        FichaLectura existente = FichaLectura.de(
                ColeccionesStock.CELULARES, "cel-1", "CEL-3", "CEL", null,
                "celular", "Samsung", "A54", "123456789012345", "usado", "en_stock", "", "Depósito");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(existente));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("CEL-4");
        esperado.setTipo("celular");
        when(stockUnidadesService.obtenerPorCodigo("CEL-4")).thenReturn(esperado);

        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("celular");
        dto.setMarca("Samsung");
        dto.setModelo("A55");
        dto.setSerieOImei("987654321098765");
        dto.setCondicion("nuevo");

        UnidadStockDTO resultado = service.alta(dto, "admin-uid");

        assertNotNull(resultado);
        assertEquals("CEL-4", resultado.getCodigo());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> camposCaptor = ArgumentCaptor.forClass(Map.class);
        verify(celularRepository).actualizar(anyString(), camposCaptor.capture());

        Map<String, Object> campos = camposCaptor.getValue();
        assertEquals("CEL-4", campos.get("codigo_interno"));
        assertEquals("Samsung", campos.get("marca"));
        assertEquals("A55", campos.get("modelo"));
        assertEquals("987654321098765", campos.get("imei"));
        assertEquals("nuevo", campos.get("condicion"));
        assertEquals("en_stock", campos.get("estado"));
    }

    @Test
    void modificarComputadoraLlamaAEditarFicha() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.COMPUTADORAS, "uuid-pc-1", "PC-1", "PC", null,
                "desktop", "", "", "SN-OLD", "usado", "SIN_ASIGNAR", "", "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("PC-1");
        when(stockUnidadesService.obtenerPorCodigo("PC-1")).thenReturn(esperado);

        ModificarUnidadStockDTO dto = new ModificarUnidadStockDTO();
        dto.setSerieOImei("SN-NEW");
        dto.setCondicion("reacondicionado");

        UnidadStockDTO resultado = service.modificar("PC-1", dto, "operador-1");
        assertNotNull(resultado);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> cuerpoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(computadoraHistorialService).editarFicha(eq("uuid-pc-1"), cuerpoCaptor.capture(), eq("operador-1"));

        Map<String, Object> cuerpo = cuerpoCaptor.getValue();
        assertEquals("SN-NEW", cuerpo.get("serialEquipo"));
        assertEquals("reacondicionado", cuerpo.get("condicion"));
    }

    @Test
    void bajaExigeMotivoObligatorio() {
        BajaUnidadStockDTO sinMotivo = new BajaUnidadStockDTO();
        sinMotivo.setMotivo("");

        assertThrows(IllegalArgumentException.class, () -> service.darDeBaja("PC-1", sinMotivo, "usr"));
        assertThrows(IllegalArgumentException.class, () -> service.darDeBaja("PC-1", null, "usr"));
    }

    @Test
    void bajaComputadoraCambiaEstadoYGuardaHistorial() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.COMPUTADORAS, "uuid-pc-1", "PC-1", "PC", null,
                "desktop", "", "", "SN-1", "usado", "SIN_ASIGNAR", "", "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("PC-1");
        esperado.setEstadoDeposito("Baja");
        when(stockUnidadesService.obtenerPorCodigo("PC-1")).thenReturn(esperado);

        BajaUnidadStockDTO dto = new BajaUnidadStockDTO();
        dto.setMotivo("Motherboard quemada");

        UnidadStockDTO resultado = service.darDeBaja("PC-1", dto, "usr-baja");
        assertEquals("PC-1", resultado.getCodigo());

        verify(computadoraHistorialService).cambiarEstado(
                eq("uuid-pc-1"), eq("BAJA"), eq("Motherboard quemada"), anyMap(), eq("usr-baja"));
    }

    @Test
    void bajaPerifericoActualizaEstadoConSetMerge() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES, "perif-1", "TEC-1", "TEC", null,
                "teclado", "Logitech", "", "SN-K120", "", "SIN_ASIGNAR", "2026-01-01", "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("TEC-1");
        esperado.setEstadoDeposito("Baja");
        when(stockUnidadesService.obtenerPorCodigo("TEC-1")).thenReturn(esperado);

        BajaUnidadStockDTO dto = new BajaUnidadStockDTO();
        dto.setMotivo("Teclas rotas");

        UnidadStockDTO resultado = service.darDeBaja("TEC-1", dto, "usr-baja");
        assertNotNull(resultado);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> camposCaptor = ArgumentCaptor.forClass(Map.class);
        verify(perifericoManualRepository).actualizar(eq("perif-1"), camposCaptor.capture());

        Map<String, Object> campos = camposCaptor.getValue();
        assertEquals("Teclas rotas", campos.get("motivo_baja"));
        assertEquals("usr-baja", campos.get("usuario_baja"));
        assertNotNull(campos.get("estadoActual"));
    }
}
