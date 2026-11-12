package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.MigracionEstadoMasivoResultDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@ExtendWith(MockitoExtension.class)
class MigracionEstadosServiceTest {

    @Mock
    private ComputadoraRepository computadoraRepository;

    @Mock
    private CamaraRepository camaraRepository;

    @Mock
    private ComputadoraHistorialService computadoraHistorialService;

    private MigracionEstadosService service;

    @BeforeEach
    void setUp() {
        service = new MigracionEstadosService(computadoraRepository, camaraRepository, computadoraHistorialService);
    }

    @Test
    void normalizarAsignacionesPcs_pcSinAsignarConResponsable_seActualizaAAsignada() throws Exception {
        Computadora pc = new Computadora();
        pc.setUuid("pc-1");
        pc.setResponsableInventario("CANDE-REARTES");
        pc.setUbicacion(Ubicacion.ADMINISTRACION);
        Estado st = new Estado();
        st.setNombre("Sin Asignar");
        pc.setEstadoActual(st);

        when(computadoraRepository.findAllSinCache()).thenReturn(List.of(pc));

        MigracionEstadoMasivoResultDTO result = service.normalizarAsignacionesPcs(null);

        assertEquals(1, result.getComputadorasActualizadas());
        assertEquals(0, result.getComputadorasOmitidas());
        verify(computadoraHistorialService).cambiarEstado(eq("pc-1"), eq("ASIGNADA"), any(), any(), eq("SISTEMA"));
    }

    @Test
    void normalizarAsignacionesPcs_pcEnBajaOMantenimiento_seOmite() throws Exception {
        Computadora pcBaja = new Computadora();
        pcBaja.setUuid("pc-baja");
        pcBaja.setResponsableInventario("JUAN");
        Estado stBaja = new Estado();
        stBaja.setNombre("Baja Definitiva");
        pcBaja.setEstadoActual(stBaja);

        Computadora pcMant = new Computadora();
        pcMant.setUuid("pc-mant");
        pcMant.setResponsableInventario("JUAN");
        Estado stMant = new Estado();
        stMant.setNombre("En mantenimiento");
        pcMant.setEstadoActual(stMant);

        when(computadoraRepository.findAllSinCache()).thenReturn(List.of(pcBaja, pcMant));

        MigracionEstadoMasivoResultDTO result = service.normalizarAsignacionesPcs(null);

        assertEquals(0, result.getComputadorasActualizadas());
        assertEquals(2, result.getComputadorasOmitidas());
        verify(computadoraHistorialService, never()).cambiarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void normalizarAsignacionesPcs_pcSinResponsableEnDeposito_seOmite() throws Exception {
        Computadora pc = new Computadora();
        pc.setUuid("pc-dep");
        pc.setEnDeposito(true);
        Estado st = new Estado();
        st.setNombre("Sin Asignar");
        pc.setEstadoActual(st);

        when(computadoraRepository.findAllSinCache()).thenReturn(List.of(pc));

        MigracionEstadoMasivoResultDTO result = service.normalizarAsignacionesPcs(null);

        assertEquals(0, result.getComputadorasActualizadas());
        assertEquals(1, result.getComputadorasOmitidas());
        verify(computadoraHistorialService, never()).cambiarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void normalizarAsignacionesPcs_pcSinResponsableEnAreaOperativa_seActualizaComoArea() throws Exception {
        Computadora pc = new Computadora();
        pc.setUuid("pc-area");
        pc.setUbicacion(Ubicacion.SEGURIDAD_PRIVADA);
        Estado st = new Estado();
        st.setNombre("Sin Asignar");
        pc.setEstadoActual(st);

        when(computadoraRepository.findAllSinCache()).thenReturn(List.of(pc));

        MigracionEstadoMasivoResultDTO result = service.normalizarAsignacionesPcs("Migración de área");

        assertEquals(1, result.getComputadorasActualizadas());
        verify(computadoraHistorialService).cambiarEstado(eq("pc-area"), eq("ASIGNADA"), eq("Migración de área"), any(), eq("SISTEMA"));
    }
}
