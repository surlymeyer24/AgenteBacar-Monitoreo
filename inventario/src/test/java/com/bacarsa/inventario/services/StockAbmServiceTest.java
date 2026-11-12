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
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@ExtendWith(MockitoExtension.class)
class StockAbmServiceTest {

    @Mock
    private StockUnidadesService stockUnidadesService;
    @Mock
    private PerifericoManualRepository perifericoManualRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private ComputadoraRepository computadoraRepository;
    @Mock
    private AuditStockService auditService;

    private StockAbmService service;

    @BeforeEach
    void setUp() {
        service = new StockAbmService(
                stockUnidadesService,
                perifericoManualRepository,
                celularRepository,
                computadoraRepository,
                auditService);
    }

    @Test
    void prefijosValidosYSiguienteCodigo() {
        assertEquals("PC", StockAbmService.prefijoParaTipo("desktop"));
        assertEquals("PC", StockAbmService.prefijoParaTipo("computadora"));
        assertEquals("NB", StockAbmService.prefijoParaTipo("notebook"));
        assertEquals("MON", StockAbmService.prefijoParaTipo("monitor"));
        assertEquals("TEC", StockAbmService.prefijoParaTipo("teclado"));
        assertEquals("CEL", StockAbmService.prefijoParaTipo("celular"));
        assertEquals("CAM", StockAbmService.prefijoParaTipo("camara"));
        assertEquals("CAM", StockAbmService.prefijoParaTipo("camara_ip"));
        assertEquals("TV", StockAbmService.prefijoParaTipo("televisor"));
        assertEquals("RTR", StockAbmService.prefijoParaTipo("router"));
        assertEquals("SW", StockAbmService.prefijoParaTipo("switch"));
        assertEquals("AP", StockAbmService.prefijoParaTipo("access_point"));
        assertEquals("TEL", StockAbmService.prefijoParaTipo("telefono_ip"));
        assertEquals("OTR", StockAbmService.prefijoParaTipo("otro"));
        assertEquals("OTR", StockAbmService.prefijoParaTipo("tablet"));
        assertEquals("OTR", StockAbmService.prefijoParaTipo("desconocido"));

        assertThrows(IllegalArgumentException.class, () -> StockAbmService.prefijoParaTipo(""));
        assertThrows(IllegalArgumentException.class, () -> StockAbmService.prefijoParaTipo("   "));
    }

    @Test
    void altaComputadoraPersisteEnPerifericosManuales() throws Exception {
        when(stockUnidadesService.leerFichas()).thenReturn(List.of());

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("PC-1");
        esperado.setTipo("desktop");
        when(stockUnidadesService.obtenerPorCodigo("PC-1")).thenReturn(esperado);

        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("desktop");
        dto.setMarca("Dell");
        dto.setModelo("OptiPlex 3080");
        dto.setSerieOImei("SN-123");
        dto.setCondicion("nuevo");
        dto.setUbicacion("DEPOSITO");
        dto.setNotas("Ingreso a stock");

        UnidadStockDTO resultado = service.alta(dto, "user-1");

        assertNotNull(resultado);
        assertEquals("PC-1", resultado.getCodigo());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> camposCaptor = ArgumentCaptor.forClass(Map.class);
        verify(perifericoManualRepository).actualizar(anyString(), camposCaptor.capture());

        Map<String, Object> campos = camposCaptor.getValue();
        assertEquals("PC-1", campos.get("codigo_interno"));
        assertEquals("desktop", campos.get("tipo"));
        assertEquals("Dell", campos.get("fabricante"));
        assertEquals("OptiPlex 3080", campos.get("nombre"));
        assertEquals("SN-123", campos.get("numero_serie"));
        assertEquals("DEPOSITO", campos.get("ubicacion"));
        assertEquals("nuevo", campos.get("condicion"));
    }

    @Test
    void altaCelularGeneraCodigoYPersisteEnPerifericosManuales() throws Exception {
        FichaLectura existente = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES, "cel-1", "CEL-3", "CEL", null,
                "celular", "Samsung", "A54", "123456789012345", "usado", "SIN_ASIGNAR", "", "Depósito");
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
        verify(perifericoManualRepository).actualizar(anyString(), camposCaptor.capture());

        Map<String, Object> campos = camposCaptor.getValue();
        assertEquals("CEL-4", campos.get("codigo_interno"));
        assertEquals("Samsung", campos.get("fabricante"));
        assertEquals("A55", campos.get("nombre"));
        assertEquals("987654321098765", campos.get("numero_serie"));
        assertEquals("nuevo", campos.get("condicion"));
    }

    @Test
    void modificarUnidadActualizaPerifericosManuales() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES, "p-1", "PC-1", "PC", null,
                "desktop", "Dell", "OptiPlex", "SN-OLD", "usado", "SIN_ASIGNAR", "", "DEPOSITO");
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
        verify(perifericoManualRepository).actualizar(eq("p-1"), cuerpoCaptor.capture());

        Map<String, Object> cuerpo = cuerpoCaptor.getValue();
        assertEquals("SN-NEW", cuerpo.get("numero_serie"));
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
    void bajaActualizaEstadoConMotivoYUsuario() throws Exception {
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

    @Test
    void bajaCelularActualizaColeccionCelularesYNoPerifericosManuales() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.CELULARES, "CIzedEofIuO123", "CEL-7", "CEL", null,
                "celular", "Samsung", "A14", "351234567890", "", "en_stock", "", "");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("CEL-7");
        esperado.setEstadoDeposito("baja");
        when(stockUnidadesService.obtenerPorCodigo("CEL-7")).thenReturn(esperado);

        BajaUnidadStockDTO dto = new BajaUnidadStockDTO();
        dto.setMotivo("Pantalla rota");

        UnidadStockDTO resultado = service.darDeBaja("CEL-7", dto, "usr-baja");
        assertNotNull(resultado);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> camposCaptor = ArgumentCaptor.forClass(Map.class);
        verify(celularRepository).actualizar(eq("CIzedEofIuO123"), camposCaptor.capture());

        Map<String, Object> campos = camposCaptor.getValue();
        assertEquals("baja", campos.get("estado"));
        assertEquals("Pantalla rota", campos.get("motivo_baja"));
        assertEquals("usr-baja", campos.get("usuario_baja"));
    }
}
