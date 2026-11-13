package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.repository.ComputadoraRepository;

/**
 * Regla de baja (PR #3): solo desde reparación y con motivo. El estado se escribe
 * vía {@link ComputadoraHistorialService} (ficha + renglón en la misma transacción).
 */
@ExtendWith(MockitoExtension.class)
class ComputadoraServiceTest {

    @Mock
    private ComputadoraRepository computadoraRepository;

    @Mock
    private ResponsableService responsableService;

    @Mock
    private ComputadoraHistorialService historialService;

    private ComputadoraService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new ComputadoraService(computadoraRepository, responsableService, historialService);
        lenient().when(computadoraRepository.listProgramas("pc-1")).thenReturn(List.of());
    }

    @Test
    void bajaDesdeReparacionGuardaEstadoYMotivoSinBorrar() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("En mantenimiento"), pc("Baja"));

        service.cambiarEstado("pc-1", dto("BAJA", "  placa rota  "), "uid");

        verify(historialService).cambiarEstado(eq("pc-1"), eq("BAJA"), eq("placa rota"), anyMap(), eq("uid"));
        verify(computadoraRepository, never()).deleteByUuid(any());
    }

    @Test
    void bajaDesdeAsignadaEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("Asignada"));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "ya no sirve"), "uid"));

        assertEquals("Solo se puede dar de baja un equipo que está en mantenimiento", error.getMessage());
        verify(historialService, never()).cambiarEstado(anyString(), anyString(), any(), any(), any());
        verify(computadoraRepository, never()).deleteByUuid(any());
    }

    @Test
    void bajaDesdeSinAsignarEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("Sin Asignar"));

        assertThrows(IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "no corresponde"), "uid"));

        verify(historialService, never()).cambiarEstado(anyString(), anyString(), any(), any(), any());
    }

    @Test
    void bajaSinMotivoEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("En mantenimiento"));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "   "), "uid"));

        assertEquals("El motivo es obligatorio para dar de baja", error.getMessage());
        verify(historialService, never()).cambiarEstado(anyString(), anyString(), any(), any(), any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void sinAsignarSigueGuardandoUbicacionDeStock() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("Asignada"), pc("Sin Asignar"));

        CambiarEstadoDTO body = dto("SIN_ASIGNAR", "vuelve a depósito");
        body.setUbicacionStock("Depósito IT");

        service.cambiarEstado("pc-1", body, "uid");

        ArgumentCaptor<Map<String, Object>> ficha = ArgumentCaptor.forClass(Map.class);
        verify(historialService).cambiarEstado(
                eq("pc-1"), eq("SIN_ASIGNAR"), eq("vuelve a depósito"), ficha.capture(), eq("uid"));
        assertEquals("Depósito IT", ficha.getValue().get("ubicacionStock"));
        verify(computadoraRepository, never()).deleteByUuid(any());
    }

    private static CambiarEstadoDTO dto(String estado, String motivo) {
        CambiarEstadoDTO dto = new CambiarEstadoDTO();
        dto.setEstado(estado);
        dto.setMotivo(motivo);
        return dto;
    }

    private static Computadora pc(String nombreEstado) {
        Estado estado = new Estado();
        estado.setNombre(nombreEstado);
        Computadora pc = new Computadora();
        pc.setUuid("pc-1");
        pc.setHostname("HOST-1");
        pc.setEstadoActual(estado);
        return pc;
    }
}
