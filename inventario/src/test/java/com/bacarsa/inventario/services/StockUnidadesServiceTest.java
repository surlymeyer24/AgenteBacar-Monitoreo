package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.TipoEquipo;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MergeCodigoInterno;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@ExtendWith(MockitoExtension.class)
class StockUnidadesServiceTest {

    @Mock
    private ComputadoraRepository computadoraRepository;
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

    private StockUnidadesService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new StockUnidadesService(
                computadoraRepository,
                perifericoManualRepository,
                celularRepository,
                camaraRepository,
                televisorRepository,
                routerRepository,
                switchRedRepository,
                accessPointRepository);
        when(computadoraRepository.findAll()).thenReturn(List.of());
        when(perifericoManualRepository.findAll()).thenReturn(List.of());
        when(celularRepository.findAll()).thenReturn(List.of());
        when(camaraRepository.findAll()).thenReturn(List.of());
        when(televisorRepository.findAll()).thenReturn(List.of());
        when(routerRepository.findAll()).thenReturn(List.of());
        when(switchRedRepository.findAll()).thenReturn(List.of());
        when(accessPointRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void elGetNoEscribe() throws Exception {
        Computadora pc = desktop("pc-1", "PC-1");
        when(computadoraRepository.findAll()).thenReturn(List.of(pc));

        assertEquals(1, service.listar().size());
        assertEquals("PC-1", service.listar().get(0).getCodigo());

        verify(computadoraRepository, never()).mergeUpdates(anyString(), org.mockito.ArgumentMatchers.anyMap());
        verify(perifericoManualRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(celularRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(camaraRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(televisorRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(routerRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(switchRedRepository, never()).mergeCodigoInterno(anyString(), anyString());
        verify(accessPointRepository, never()).mergeCodigoInterno(anyString(), anyString());
    }

    @Test
    void elBackfillEscribeSoloElCampoCodigoEnLaFichaSinCodigo() throws Exception {
        Computadora yaTiene = desktop("pc-vieja", "PC-7");
        Computadora falta = desktop("pc-nueva", null);
        when(computadoraRepository.findAll()).thenReturn(List.of(yaTiene, falta));

        service.backfill();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> parche = ArgumentCaptor.forClass(Map.class);
        verify(computadoraRepository, times(1)).mergeUpdates(org.mockito.ArgumentMatchers.eq("pc-nueva"), parche.capture());
        assertEquals(Map.of(MergeCodigoInterno.CAMPO, "PC-8"), parche.getValue());
        verify(computadoraRepository, never()).mergeUpdates(org.mockito.ArgumentMatchers.eq("pc-vieja"), org.mockito.ArgumentMatchers.anyMap());
    }

    @Test
    void siUnaColeccionFallaElListadoSigueConElResto() throws Exception {
        when(computadoraRepository.findAll()).thenThrow(new ExecutionException("caida", null));
        com.bacarsa.inventario.models.Celular celular = new com.bacarsa.inventario.models.Celular();
        celular.setId("cel-1");
        celular.setCodigoInterno("CEL-1");
        celular.setMarca("Nokia");
        when(celularRepository.findAll()).thenReturn(List.of(celular));

        assertEquals(1, service.listar().size());
        assertEquals("CEL-1", service.listar().get(0).getCodigo());
        assertEquals("celular", service.listar().get(0).getTipo());
    }

    private static Computadora desktop(String uuid, String codigo) {
        Computadora computadora = new Computadora();
        computadora.setUuid(uuid);
        computadora.setCodigoInterno(codigo);
        TipoEquipo tipo = new TipoEquipo();
        tipo.setTipo("desktop");
        computadora.setTipoEquipo(tipo);
        return computadora;
    }
}
