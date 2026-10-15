package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
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
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.TipoEquipo;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@ExtendWith(MockitoExtension.class)
class StockAsignacionesServiceTest {

    @Mock
    private MovimientoStockRepository movimientoStockRepository;
    @Mock
    private StockUnidadesService stockUnidadesService;
    @Mock
    private ComputadoraHistorialService computadoraHistorialService;
    @Mock
    private ComputadoraRepository computadoraRepository;
    @Mock
    private CelularRepository celularRepository;
    @Mock
    private PerifericoManualRepository perifericoManualRepository;
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

    private StockAsignacionesService service;

    @BeforeEach
    void setUp() {
        service = new StockAsignacionesService(
                movimientoStockRepository,
                stockUnidadesService,
                computadoraHistorialService,
                computadoraRepository,
                celularRepository,
                perifericoManualRepository,
                camaraRepository,
                televisorRepository,
                routerRepository,
                switchRedRepository,
                accessPointRepository);
    }

    @Test
    void asignarNotebookValida_dejaMovimientoActivoYActualizaFicha() throws Exception {
        FichaLectura ficha = FichaLectura.de(
                ColeccionesStock.COMPUTADORAS,
                "uuid-nb-1",
                "NB-12",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14",
                "SN-1234",
                "Usado",
                "Disponible",
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

        // Verifica que se haya llamado al historial para cambiar a ASIGNADA
        verify(computadoraHistorialService).cambiarEstado(
                eq("uuid-nb-1"),
                eq(EstadoOperativo.ASIGNADA.name()),
                anyString(),
                anyMap(),
                eq("usr-soporte"));

        // Verifica que se haya actualizado a Activa en el repo
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
                ColeccionesStock.COMPUTADORAS,
                "uuid-nb-2",
                "NB-15",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad",
                "SN-9999",
                "Nuevo",
                "Disponible",
                "2026-09-01",
                "DEPOSITO");
        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha));

        doThrow(new RuntimeException("Error en Firestore"))
                .when(computadoraHistorialService).cambiarEstado(anyString(), anyString(), anyString(), anyMap(), anyString());

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
                ColeccionesStock.COMPUTADORAS,
                "uuid-nb-1",
                "NB-12",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14",
                "SN-1234",
                "Usado",
                "Asignada",
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

        // Verifica que la PC se haya pasado a SIN_ASIGNAR
        verify(computadoraHistorialService).cambiarEstado(
                eq("uuid-nb-1"),
                eq(EstadoOperativo.SIN_ASIGNAR.name()),
                eq("Fin de proyecto"),
                anyMap(),
                eq("usr-soporte"));

        // Verifica que el movimiento activo se haya cerrado con estado Finalizada
        verify(movimientoStockRepository).update(eq("mov-1"), anyMap());
    }

    @Test
    void listar_incluyePcsYaAsignadasYCelularesLiberados() throws Exception {
        // Movimiento real en el libro
        MovimientoStock real = new MovimientoStock();
        real.setId("mov-real-1");
        real.setCodigo("NB-12");
        real.setTipo("Notebook");
        real.setResponsable("Carlos Varela");
        real.setAccion("Asignación");
        real.setEstado("Activa");
        real.setFecha("2026-10-10 10:00:00");

        when(movimientoStockRepository.findAll()).thenReturn(List.of(real));

        // PC ya asignada previamente en la colección computadoras
        Computadora pcAsignada = new Computadora();
        pcAsignada.setUuid("uuid-pc-vieja");
        pcAsignada.setCodigoInterno("PC-0048");
        pcAsignada.setHostname("BAC-ADM-023");
        pcAsignada.setSerialEquipo("SN-DL-8841");
        pcAsignada.setResponsableInventario("Laura Gómez");
        pcAsignada.setUbicacion(Ubicacion.ADMINISTRACION);
        Estado est = new Estado();
        est.setNombre("Asignada");
        pcAsignada.setEstadoActual(est);

        when(computadoraRepository.findAll()).thenReturn(List.of(pcAsignada));

        // Celular liberado previamente en la colección celulares
        Celular celLiberado = new Celular();
        celLiberado.setId("cel-viejo");
        celLiberado.setCodigoInterno("CEL-0014");
        celLiberado.setMarca("Samsung");
        celLiberado.setModelo("Galaxy A15");
        celLiberado.setImei("864019247192");
        celLiberado.setResponsable("Diego Ramos");
        celLiberado.setArea("Ventas");
        celLiberado.setEstado("activo");

        when(celularRepository.findAll()).thenReturn(List.of(celLiberado));

        List<MovimientoStockDTO> lista = service.listar();

        assertNotNull(lista);
        assertEquals(3, lista.size());

        // Verifica que aparezcan en el libro
        assertTrue(lista.stream().anyMatch(m -> "Carlos Varela".equals(m.getResponsable()) && "NB-12".equals(m.getCodigo())));
        assertTrue(lista.stream().anyMatch(m -> "Laura Gómez".equals(m.getResponsable()) && "PC-0048".equals(m.getCodigo())));
        assertTrue(lista.stream().anyMatch(m -> "Diego Ramos".equals(m.getResponsable()) && "CEL-0014".equals(m.getCodigo())));
    }
}
