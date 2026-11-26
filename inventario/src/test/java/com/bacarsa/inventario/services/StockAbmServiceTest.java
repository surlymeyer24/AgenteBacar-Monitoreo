package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;

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
    @Mock
    private StockFichaRepository stockFichaRepository;

    private StockAbmService service;

    @BeforeEach
    void setUp() {
        service = new StockAbmService(
                stockUnidadesService,
                perifericoManualRepository,
                celularRepository,
                computadoraRepository,
                auditService,
                stockFichaRepository,
                null);
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
        when(stockFichaRepository.findAll()).thenReturn(List.of());

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
        dto.setCpuModelo("i5-10400");
        dto.setRamTotalGb(16);
        dto.setDiscoResumen("512 GB SSD");

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
        @SuppressWarnings("unchecked")
        Map<String, Object> spec = (Map<String, Object>) campos.get("especificacion_stock");
        assertNotNull(spec);
        assertEquals("i5-10400", spec.get("cpu_modelo"));
        assertEquals(16, spec.get("ram_total_gb"));
        assertEquals("512 GB SSD", spec.get("disco_resumen"));
        verify(stockFichaRepository, never()).save(any(StockFicha.class));
    }

    @Test
    void altaPcSinSpecEsRechazada() throws Exception {
        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("computadora");
        dto.setMarca("Dell");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.alta(dto, "user-1"));
        assertEquals("CPU es obligatoria para desktop/notebook", ex.getMessage());
        verify(perifericoManualRepository, never()).actualizar(anyString(), anyMap());
    }

    @Test
    void altaPcSinDiscoEsRechazada() {
        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("notebook");
        dto.setCpuModelo("Ryzen 5");
        dto.setRamTotalGb(8);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.alta(dto, "user-1"));
        assertEquals("Disco es obligatorio para desktop/notebook", ex.getMessage());
    }

    @Test
    void altaConStockFichasVaciaNoCreaFicha() throws Exception {
        when(stockUnidadesService.leerFichas()).thenReturn(List.of());
        when(stockFichaRepository.findAll()).thenReturn(List.of());
        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("TEC-1");
        when(stockUnidadesService.obtenerPorCodigo("TEC-1")).thenReturn(esperado);

        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("teclado");
        dto.setMarca("Logitech");

        service.alta(dto, "user-1");

        verify(perifericoManualRepository).actualizar(anyString(), anyMap());
        verify(stockFichaRepository, never()).save(any(StockFicha.class));
    }

    @Test
    void altaConStockFichasEnUsoCreaFicha() throws Exception {
        when(stockUnidadesService.leerFichas()).thenReturn(List.of());
        when(stockFichaRepository.findAll()).thenReturn(List.of(
                StockFicha.builder().codigoInterno("MON-1").estado("EN_DEPOSITO").build()));
        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("TEC-1");
        when(stockUnidadesService.obtenerPorCodigo("TEC-1")).thenReturn(esperado);

        AltaUnidadStockDTO dto = new AltaUnidadStockDTO();
        dto.setTipo("teclado");
        dto.setMarca("Logitech");
        dto.setModelo("K120");

        service.alta(dto, "user-1");

        ArgumentCaptor<StockFicha> fichaCaptor = ArgumentCaptor.forClass(StockFicha.class);
        verify(stockFichaRepository).save(fichaCaptor.capture());
        assertEquals("TEC-1", fichaCaptor.getValue().getCodigoInterno());
        assertEquals("EN_DEPOSITO", fichaCaptor.getValue().getEstado());
    }

    @Test
    void altaCelularGeneraCodigoYPersisteEnPerifericosManuales() throws Exception {
        FichaLectura existente = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES, "cel-1", "CEL-3", "CEL", null,
                "celular", "Samsung", "A54", "123456789012345", "usado", "SIN_ASIGNAR", "", "Depósito");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(existente));
        when(stockFichaRepository.findAll()).thenReturn(List.of());

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
        verify(stockFichaRepository, never()).save(any(StockFicha.class));
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
    void modificarPcCompletaSpecYPersiste() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES, "p-64", "PC-64", "PC", null,
                "desktop", "PC Clon", "", "", "usado", "SIN_ASIGNAR", "", "deposito");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        UnidadStockDTO esperado = new UnidadStockDTO();
        esperado.setCodigo("PC-64");
        esperado.setDescripcionCompleta("Ryzen 5 4600G · 16 GB RAM · 512 GB SSD");
        when(stockUnidadesService.obtenerPorCodigo("PC-64")).thenReturn(esperado);

        ModificarUnidadStockDTO dto = new ModificarUnidadStockDTO();
        dto.setCpuModelo("Ryzen 5 4600G");
        dto.setRamTotalGb(16);
        dto.setDiscoResumen("512 GB SSD");

        UnidadStockDTO resultado = service.modificar("PC-64", dto, "operador-1");
        assertNotNull(resultado);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> cuerpoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(perifericoManualRepository).actualizar(eq("p-64"), cuerpoCaptor.capture());

        @SuppressWarnings("unchecked")
        Map<String, Object> spec = (Map<String, Object>) cuerpoCaptor.getValue().get("especificacion_stock");
        assertNotNull(spec);
        assertEquals("Ryzen 5 4600G", spec.get("cpu_modelo"));
        assertEquals(16, spec.get("ram_total_gb"));
        assertEquals("512 GB SSD", spec.get("disco_resumen"));
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
