package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@ExtendWith(MockitoExtension.class)
class ComputadoraServiceTest {

    @Mock
    private ComputadoraRepository computadoraRepository;

    @Mock
    private ResponsableService responsableService;

    private ComputadoraService service;

    @BeforeEach
    void setUp() {
        service = new ComputadoraService(computadoraRepository, responsableService);
    }

    @Test
    void bajaDesdeReparacionPersisteEstadoYMotivoSinBorrar() throws Exception {
        when(computadoraRepository.findByUuid("pc-1"))
                .thenReturn(pc("En mantenimiento"), pc("Baja"));
        when(computadoraRepository.listProgramas("pc-1")).thenReturn(List.of());

        ComputadoraDTO result = service.cambiarEstado("pc-1", dto("BAJA", "  placa rota  "));

        ArgumentCaptor<Estado> estado = ArgumentCaptor.forClass(Estado.class);
        verify(computadoraRepository).cambiarEstado(
                eq("pc-1"), estado.capture(), eq("placa rota"), isNull(), isNull());
        assertEquals("Baja", estado.getValue().getNombre());
        assertEquals("Equipo dado de baja", estado.getValue().getDescripcion());
        assertEquals("Baja", result.getEstadoActual());
        verify(computadoraRepository, never()).deleteByUuid(any());
    }

    @Test
    void bajaDesdeAsignadaEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("Asignada"));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "ya no sirve")));

        assertEquals(
                "Solo se puede dar de baja un equipo que está en mantenimiento",
                error.getMessage());
        verify(computadoraRepository, never()).cambiarEstado(any(), any(), any(), any(), any());
        verify(computadoraRepository, never()).deleteByUuid(any());
    }

    @Test
    void bajaDesdeSinAsignarEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("Sin Asignar"));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "no corresponde")));

        verify(computadoraRepository, never()).cambiarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void bajaSinMotivoEsRechazadaYNoEscribe() throws Exception {
        when(computadoraRepository.findByUuid("pc-1")).thenReturn(pc("En mantenimiento"));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.cambiarEstado("pc-1", dto("BAJA", "   ")));

        assertEquals("El motivo es obligatorio para dar de baja", error.getMessage());
        verify(computadoraRepository, never()).cambiarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void sinAsignarSigueGuardandoUbicacionDeStock() throws Exception {
        when(computadoraRepository.findByUuid("pc-1"))
                .thenReturn(pc("Asignada"), pc("Sin Asignar"));
        when(computadoraRepository.listProgramas("pc-1")).thenReturn(List.of());

        CambiarEstadoDTO body = dto("SIN_ASIGNAR", "vuelve a depósito");
        body.setUbicacionStock("Depósito IT");

        ComputadoraDTO result = service.cambiarEstado("pc-1", body);

        ArgumentCaptor<Estado> estado = ArgumentCaptor.forClass(Estado.class);
        verify(computadoraRepository).cambiarEstado(
                eq("pc-1"), estado.capture(), eq("vuelve a depósito"), eq("Depósito IT"), eq(""));
        assertEquals("Sin Asignar", estado.getValue().getNombre());
        assertEquals("Sin Asignar", result.getEstadoActual());
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
        return new Computadora("pc-1", "HOST-1", null, null, null, estado);
    }
}
