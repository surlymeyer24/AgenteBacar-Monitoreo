package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.function.BiFunction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.TelevisorCreateDTO;
import com.bacarsa.inventario.dto.TelevisorDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.repository.TelevisorRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class TelevisorServiceTest {

    @Mock
    private TelevisorRepository televisorRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private TelevisorService service;

    @BeforeEach
    void setUp() {
        service = new TelevisorService(televisorRepository, usuarioRepository);
    }

    @Test
    void crearAplicaHistorialAltaManual() throws Exception {
        TelevisorCreateDTO dto = new TelevisorCreateDTO();
        dto.setMarca("Samsung");
        dto.setModelo("Crystal UHD 55");
        dto.setNumeroSerie("SN-TV-55-1234");
        dto.setArea("Sala de Reuniones");
        dto.setDireccionIp("192.168.1.60");
        dto.setEstado("activo");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            String id = inv.getArgument(0);
            Televisor tv = new Televisor();
            tv.setId(id);
            tv.setMarca(dto.getMarca());
            tv.setModelo(dto.getModelo());
            tv.setNumeroSerie(dto.getNumeroSerie());
            tv.setArea(dto.getArea());
            tv.setDireccionIp(dto.getDireccionIp());
            tv.setEstado("activo");
            when(televisorRepository.findById(id)).thenReturn(tv);
            return null;
        }).when(televisorRepository).aplicarHistorial(anyString(), captor.capture());

        TelevisorDTO res = service.crear(dto, "user-uid-123");

        verify(televisorRepository).aplicarHistorial(anyString(), any());
        assertNotNull(res);
        assertEquals("Samsung", res.getMarca());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        assertEquals("Samsung", plan.campos().get("marca"));
        assertNotNull(plan.campos().get("historial"));
    }

    @Test
    void updateAplicaHistorialEdicionFicha() throws Exception {
        Televisor existente = new Televisor();
        existente.setId("tv-1");
        existente.setMarca("Samsung");
        existente.setArea("Sala A");
        existente.setEstado("activo");

        when(televisorRepository.findById("tv-1")).thenReturn(existente);

        TelevisorCreateDTO dto = new TelevisorCreateDTO();
        dto.setMarca("Samsung");
        dto.setArea("Sala B");
        dto.setEstado("activo");

        service.update("tv-1", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(televisorRepository).aplicarHistorial(eq("tv-1"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("marca", "Samsung", "area", "Sala A", "estado", "activo"), Timestamp.now());
        assertNotNull(plan);
        assertEquals("Sala B", plan.campos().get("area"));
    }

    @Test
    void cambiarEstadoAplicaHistorial() throws Exception {
        Televisor existente = new Televisor();
        existente.setId("tv-1");
        existente.setMarca("LG");
        existente.setArea("Comedor");
        existente.setEstado("activo");

        when(televisorRepository.findById("tv-1")).thenReturn(existente);

        service.cambiarEstado("tv-1", "baja", "Pantalla rota", "admin-uid");

        verify(televisorRepository).aplicarHistorial(eq("tv-1"), any());
    }
}
