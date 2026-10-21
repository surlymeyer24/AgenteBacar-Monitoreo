package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
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

import com.bacarsa.inventario.dto.AsignarUnidadStockDTO;
import com.bacarsa.inventario.dto.DevolverUnidadStockDTO;
import com.bacarsa.inventario.dto.MovimientoStockDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@ExtendWith(MockitoExtension.class)
class StockAsignacionesServiceTest {

    @Mock
    private MovimientoStockRepository movimientoStockRepository;
    @Mock
    private StockUnidadesService stockUnidadesService;
    @Mock
    private PerifericoManualRepository perifericoManualRepository;
    @Mock
    private ComputadoraRepository computadoraRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private AccessPointRepository accessPointRepository;

    private StockAsignacionesService service;

    @BeforeEach
    void setUp() {
        service = new StockAsignacionesService(
                movimientoStockRepository,
                stockUnidadesService,
                perifericoManualRepository,
                computadoraRepository,
                celularRepository,
                accessPointRepository);
    }

    @Test
    void asignarNotebookValida_dejaMovimientoActivoYActualizaFicha() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES,
                "p-nb-1",
                "NB-12",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14",
                "SN-1234",
                "Usado",
                "SIN_ASIGNAR",
                "2026-09-01",
                "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Carlos Varela")
                .area("Planta Embalaje")
                .motivo("Entrega de equipo")
                .build();

        MovimientoStockDTO resultado = service.asignar("NB-12", dto, "usr-soporte");

        assertNotNull(resultado);
        assertEquals("Carlos Varela", resultado.getResponsable());
        assertEquals("Planta Embalaje", resultado.getArea());
        assertEquals("Asignación", resultado.getAccion());
        assertEquals("Activa", resultado.getEstado());
        assertEquals("NB-12", resultado.getCodigo());

        // Verifica que se haya actualizado la ficha en perifericos_manuales
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> updatesCaptor = ArgumentCaptor.forClass(Map.class);
        verify(perifericoManualRepository).actualizar(eq("p-nb-1"), updatesCaptor.capture());
        Map<String, Object> updates = updatesCaptor.getValue();
        assertEquals("Carlos Varela", updates.get("responsable"));
        assertEquals("Planta Embalaje", updates.get("ubicacion"));
        assertNotNull(updates.get("estadoActual"));

        // Verifica que se haya actualizado a Activa en el repo de movimientos
        verify(movimientoStockRepository).update(anyString(), eq(Map.of("estado", "Activa")));
    }

    @Test
    void asignarSinNombre_falla() {
        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("  ")
                .area("Ventas")
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.asignar("NB-12", dto, "usr-1"));
    }

    @Test
    void asignarFallaActualizacionFicha_movimientoQuedaPendiente() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES,
                "p-nb-2",
                "NB-15",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad",
                "SN-9999",
                "Nuevo",
                "SIN_ASIGNAR",
                "2026-09-01",
                "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        doThrow(new RuntimeException("Error en Firestore"))
                .when(perifericoManualRepository).actualizar(anyString(), anyMap());

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Laura Gómez")
                .area("Administración")
                .build();

        assertThrows(RuntimeException.class, () -> service.asignar("NB-15", dto, "usr-soporte"));

        // Verifica que el movimiento se haya guardado con estado Pendiente
        ArgumentCaptor<MovimientoStock> captor = ArgumentCaptor.forClass(MovimientoStock.class);
        verify(movimientoStockRepository).save(captor.capture());
        assertEquals("Pendiente", captor.getValue().getEstado());
        assertEquals("Laura Gómez", captor.getValue().getResponsable());
        assertEquals("NB-15", captor.getValue().getCodigo());
    }

    @Test
    void devolverNotebook_cierraMovimientoYDevuelveADisponible() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.PERIFERICOS_MANUALES,
                "p-nb-1",
                "NB-12",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14",
                "SN-1234",
                "Usado",
                "ASIGNADA",
                "2026-09-01",
                "Planta Embalaje");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        MovimientoStock movActivo = new MovimientoStock();
        movActivo.setId("mov-1");
        movActivo.setCodigo("NB-12");
        movActivo.setResponsable("Carlos Varela");
        movActivo.setArea("Planta Embalaje");
        movActivo.setEstado("Activa");

        when(movimientoStockRepository.findAll()).thenReturn(List.of(movActivo));

        DevolverUnidadStockDTO dto = DevolverUnidadStockDTO.builder()
                .motivo("Fin de proyecto")
                .build();

        MovimientoStockDTO resultado = service.devolver("NB-12", dto, "usr-soporte");

        assertNotNull(resultado);
        assertEquals("Devolución", resultado.getAccion());
        assertEquals("Finalizada", resultado.getEstado());

        // Verifica que la ficha en perifericos_manuales se haya pasado a SIN_ASIGNAR
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> updatesCaptor = ArgumentCaptor.forClass(Map.class);
        verify(perifericoManualRepository).actualizar(eq("p-nb-1"), updatesCaptor.capture());
        Map<String, Object> updates = updatesCaptor.getValue();
        assertEquals(null, updates.get("responsable"));
        assertEquals("DEPOSITO", updates.get("ubicacion"));
        assertNotNull(updates.get("estadoActual"));

        // Verifica que el movimiento activo se haya cerrado con estado Finalizada
        verify(movimientoStockRepository).update(eq("mov-1"), anyMap());
    }

    @Test
    void listar_soloDevuelveMovimientosRealesSinProyeccionesFantasma() throws Exception {
        MovimientoStock real1 = new MovimientoStock();
        real1.setId("mov-real-1");
        real1.setCodigo("NB-12");
        real1.setTipo("Notebook");
        real1.setResponsable("Carlos Varela");
        real1.setAccion("Asignación");
        real1.setEstado("Activa");
        real1.setFecha("2026-10-10 10:00:00");

        MovimientoStock real2 = new MovimientoStock();
        real2.setId("mov-real-2");
        real2.setCodigo("TEC-05");
        real2.setTipo("Teclado");
        real2.setResponsable("Martín Vega");
        real2.setAccion("Asignación");
        real2.setEstado("Activa");
        real2.setFecha("2026-10-12 11:30:00");

        when(movimientoStockRepository.findAll()).thenReturn(List.of(real1, real2));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(2, lista.size());
        assertEquals("TEC-05", lista.get(0).getCodigo()); // Ordenado por fecha desc
        assertEquals("NB-12", lista.get(1).getCodigo());
    }

    @Test
    void listar_proyectaPerifericosManualesAsignadosSinMovimientoPrevio() throws Exception {
        when(movimientoStockRepository.findAll()).thenReturn(List.of());

        PerifericoManual p1 = new PerifericoManual();
        p1.setId("perif-1");
        p1.setCodigoInterno("TEC-01");
        p1.setTipo("teclado");
        p1.setFabricante("Logitech");
        p1.setNombre("K120");
        p1.setResponsable("Laura Gómez");
        p1.setUbicacion("Administración");
        p1.setFechaAlta("2026-08-01 10:00:00");

        PerifericoManual p2 = new PerifericoManual();
        p2.setId("perif-2");
        p2.setCodigoInterno("MOU-02");
        p2.setTipo("mouse");
        p2.setComputadoraHostname("PC-ADM-01");
        p2.setFechaAlta("2026-07-01 10:00:00");

        PerifericoManual ap = new PerifericoManual();
        ap.setId("ap-1");
        ap.setCodigoInterno("AP-01");
        ap.setTipo("access_point");
        ap.setFabricante("Ubiquiti");
        ap.setNombre("UniFi U6 Pro");
        ap.setUbicacion("Sede Central - Piso 1");
        Estado estadoAp = new Estado();
        estadoAp.setNombre("OPERATIVO");
        ap.setEstadoActual(estadoAp);
        ap.setFechaAlta("2026-06-01 10:00:00");

        PerifericoManual p3Libre = new PerifericoManual();
        p3Libre.setId("perif-3");
        p3Libre.setCodigoInterno("MOU-03");
        p3Libre.setTipo("mouse");
        // No asignado

        when(perifericoManualRepository.findAll()).thenReturn(List.of(p1, p2, ap, p3Libre));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(3, lista.size());
        assertEquals("TEC-01", lista.get(0).getCodigo());
        assertEquals("Laura Gómez", lista.get(0).getResponsable());
        assertEquals("Activa", lista.get(0).getEstado());
        assertEquals("MOU-02", lista.get(1).getCodigo());
        assertEquals("PC: PC-ADM-01", lista.get(1).getResponsable());
        assertEquals("Activa", lista.get(1).getEstado());
        assertEquals("AP-01", lista.get(2).getCodigo());
        assertEquals("Access Point", lista.get(2).getTipo());
        assertEquals("Sede Central - Piso 1", lista.get(2).getResponsable());
        assertEquals("Activa", lista.get(2).getEstado());
    }

    @Test
    void listar_proyectaPcsDeOrigenStockAsignadas() throws Exception {
        when(movimientoStockRepository.findAll()).thenReturn(List.of());
        when(perifericoManualRepository.findAll()).thenReturn(List.of());

        Computadora pcStockAsignada = new Computadora();
        pcStockAsignada.setUuid("uuid-pc-1");
        pcStockAsignada.setCodigoInterno("PC-01");
        pcStockAsignada.setOrigenAlta(OrigenAlta.STOCK);
        pcStockAsignada.setResponsableInventario("Roberto Benitez");
        pcStockAsignada.setHostname("PC-ROBERTO");

        Computadora pcAgenteAsignada = new Computadora();
        pcAgenteAsignada.setUuid("uuid-pc-2");
        pcAgenteAsignada.setCodigoInterno("PC-02");
        pcAgenteAsignada.setOrigenAlta(OrigenAlta.DETECTADA_POR_AGENTE);
        pcAgenteAsignada.setResponsableInventario("Juan Carlos");

        Computadora pcStockLibre = new Computadora();
        pcStockLibre.setUuid("uuid-pc-3");
        pcStockLibre.setCodigoInterno("PC-03");
        pcStockLibre.setOrigenAlta(OrigenAlta.STOCK);
        // Sin responsable

        when(computadoraRepository.findAll()).thenReturn(List.of(pcStockAsignada, pcAgenteAsignada, pcStockLibre));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertEquals("PC-01", lista.get(0).getCodigo());
        assertEquals("Roberto Benitez", lista.get(0).getResponsable());
        assertEquals("Computadora", lista.get(0).getTipo());
        assertEquals("Activa", lista.get(0).getEstado());
    }

    @Test
    void asignarCelularValido_actualizaCelularYGeneraMovimiento() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.CELULARES,
                "cel-1",
                "CEL-01",
                "CEL",
                null,
                "celular",
                "Samsung",
                "A54",
                "123456789012345",
                "Excelente",
                "en_stock",
                "2026-09-01",
                "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        AsignarUnidadStockDTO dto = AsignarUnidadStockDTO.builder()
                .responsable("Ana Lopez")
                .area("Comercial")
                .motivo("Equipo para guardia")
                .build();

        MovimientoStockDTO resultado = service.asignar("CEL-01", dto, "usr-soporte");

        assertNotNull(resultado);
        assertEquals("Ana Lopez", resultado.getResponsable());
        assertEquals("Liberación de stock", resultado.getAccion());
        assertEquals("Activa", resultado.getEstado());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> updatesCaptor = ArgumentCaptor.forClass(Map.class);
        verify(celularRepository).update(eq("cel-1"), updatesCaptor.capture());
        Map<String, Object> updates = updatesCaptor.getValue();
        assertEquals("Ana Lopez", updates.get("responsable"));
        assertEquals("Comercial", updates.get("area"));
        assertEquals("activo", updates.get("estado"));
    }

    @Test
    void devolverCelular_vuelveAEnStock() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.CELULARES,
                "cel-1",
                "CEL-01",
                "CEL",
                null,
                "celular",
                "Samsung",
                "A54",
                "123456789012345",
                "Excelente",
                "activo",
                "2026-09-01",
                "Comercial");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        MovimientoStock movActivo = new MovimientoStock();
        movActivo.setId("mov-cel-1");
        movActivo.setCodigo("CEL-01");
        movActivo.setResponsable("Ana Lopez");
        movActivo.setArea("Comercial");
        movActivo.setEstado("Activa");

        when(movimientoStockRepository.findAll()).thenReturn(List.of(movActivo));

        DevolverUnidadStockDTO dto = DevolverUnidadStockDTO.builder()
                .motivo("Devolución por cambio de puesto")
                .build();

        MovimientoStockDTO resultado = service.devolver("CEL-01", dto, "usr-soporte");

        assertNotNull(resultado);
        assertEquals("Devolución", resultado.getAccion());
        assertEquals("Finalizada", resultado.getEstado());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> updatesCaptor = ArgumentCaptor.forClass(Map.class);
        verify(celularRepository).update(eq("cel-1"), updatesCaptor.capture());
        Map<String, Object> updates = updatesCaptor.getValue();
        assertEquals(null, updates.get("responsable"));
        assertEquals(null, updates.get("area"));
        assertEquals("en_stock", updates.get("estado"));
    }

    @Test
    void listar_proyectaCelularesAsignados() throws Exception {
        when(movimientoStockRepository.findAll()).thenReturn(List.of());
        when(perifericoManualRepository.findAll()).thenReturn(List.of());
        when(computadoraRepository.findAll()).thenReturn(List.of());

        Celular celAsignado = new Celular();
        celAsignado.setId("cel-1");
        celAsignado.setCodigoInterno("CEL-01");
        celAsignado.setMarca("Motorola");
        celAsignado.setModelo("G84");
        celAsignado.setImei("111222333444555");
        celAsignado.setResponsable("Pedro Picapiedra");
        celAsignado.setArea("Logistica");
        celAsignado.setEstado("activo");

        Celular celEnStock = new Celular();
        celEnStock.setId("cel-2");
        celEnStock.setCodigoInterno("CEL-02");
        celEnStock.setEstado("en_stock");

        when(celularRepository.findAll()).thenReturn(List.of(celAsignado, celEnStock));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertEquals("CEL-01", lista.get(0).getCodigo());
        assertEquals("Pedro Picapiedra", lista.get(0).getResponsable());
        assertEquals("Celular", lista.get(0).getTipo());
        assertEquals("Activa", lista.get(0).getEstado());
    }

    @Test
    void listar_proyectaPerifericoManualConUbicacionOperativaAunqueNoTengaResponsable() throws Exception {
        when(movimientoStockRepository.findAll()).thenReturn(List.of());
        when(computadoraRepository.findAll()).thenReturn(List.of());
        when(celularRepository.findAll()).thenReturn(List.of());

        PerifericoManual ap = new PerifericoManual();
        ap.setId("ap-mezon");
        ap.setCodigoInterno("AP-1");
        ap.setTipo("access_point");
        ap.setFabricante("TP-LINK AX3600");
        ap.setNombre("Acces Point TP LINK");
        ap.setUbicacion("MEZON_TRANSPORTISTA");
        Estado st = new Estado();
        st.setNombre("Sin Asignar");
        ap.setEstadoActual(st);

        when(perifericoManualRepository.findAll()).thenReturn(List.of(ap));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertEquals("AP-1", lista.get(0).getCodigo());
        assertEquals("MEZON_TRANSPORTISTA", lista.get(0).getResponsable());
        assertEquals("MEZON_TRANSPORTISTA", lista.get(0).getArea());
        assertEquals("Access Point", lista.get(0).getTipo());
        assertEquals("Activa", lista.get(0).getEstado());
    }

    @Test
    void listar_proyectaAccessPointsDeColeccionAccessPoints() throws Exception {
        when(movimientoStockRepository.findAll()).thenReturn(List.of());
        when(perifericoManualRepository.findAll()).thenReturn(List.of());
        when(computadoraRepository.findAll()).thenReturn(List.of());
        when(celularRepository.findAll()).thenReturn(List.of());

        AccessPoint ap = new AccessPoint();
        ap.setId("ap-eap");
        ap.setCodigoInterno("AP-2");
        ap.setNombre("EAP Adm 1");
        ap.setModelo("EAP653");
        ap.setUbicacion(UbicacionRed.ADMINISTRACION);
        ap.setEstado("OPERATIVO");

        when(accessPointRepository.findAll()).thenReturn(List.of(ap));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertEquals("AP-2", lista.get(0).getCodigo());
        assertEquals("ADMINISTRACION", lista.get(0).getResponsable());
        assertEquals("Access Point", lista.get(0).getTipo());
        assertEquals("Activa", lista.get(0).getEstado());
    }
}
