package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.ComputadoraSesionDTO;
import com.bacarsa.inventario.dto.SesionResumenHoyDTO;
import com.bacarsa.inventario.repository.SesionBloqueoRepository;
import com.bacarsa.inventario.repository.SesionEstadoTrackerRepository;

@ExtendWith(MockitoExtension.class)
class SesionBloqueoServiceTest {

    @Mock
    private SesionBloqueoRepository repository;

    @Mock
    private SesionBloqueoDeteccionService deteccionService;

    @Mock
    private SesionEstadoTrackerRepository trackerRepository;

    private SesionBloqueoService service;

    @BeforeEach
    void setUp() {
        service = new SesionBloqueoService(repository, deteccionService, trackerRepository);
    }

    @Test
    void listarComputadorasSesion_retornaListaProyectada() throws ExecutionException, InterruptedException {
        ComputadoraSesionDTO pc = new ComputadoraSesionDTO();
        pc.setId("pc-1");
        pc.setHostname("PC-TEST");
        pc.setUbicacion("ADMINISTRACION");
        pc.setSesionEstado("activa");
        pc.setSesionBloqueoAutoMin(10);
        pc.setSesionResumenHoy(new SesionResumenHoyDTO("2026-10-28", 4.5, 1.2, 0.0, 3, 3.0));

        when(repository.listarComputadorasSesion()).thenReturn(List.of(pc));

        List<ComputadoraSesionDTO> res = service.listarComputadorasSesion();

        assertNotNull(res);
        assertEquals(1, res.size());
        assertEquals("pc-1", res.get(0).getId());
        assertEquals("PC-TEST", res.get(0).getHostname());
        assertEquals("activa", res.get(0).getSesionEstado());
        assertEquals(10, res.get(0).getSesionBloqueoAutoMin());
        assertEquals(4.5, res.get(0).getSesionResumenHoy().getHorasActiva());
        verify(repository).listarComputadorasSesion();
    }
}
