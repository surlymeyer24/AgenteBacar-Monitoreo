package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.SwitchRedCreateDTO;
import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class SwitchRedServiceTest {

    @Mock
    private SwitchRedRepository switchRedRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private SwitchRedService service;

    @BeforeEach
    void setUp() {
        service = new SwitchRedService(switchRedRepository, usuarioRepository);
    }

    @Test
    void crearAplicaHistorialAltaManual() throws Exception {
        SwitchRedCreateDTO dto = new SwitchRedCreateDTO();
        dto.setNombre("Switch Core 24p");
        dto.setMarca("TP-Link");
        dto.setModelo("TL-SG3428X");
        dto.setIp("192.168.1.2");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());
        dto.setCantidadPuertos(24);
        dto.setTipo("MANAGED");
        dto.setVlans(List.of("10", "20", "30"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            String id = inv.getArgument(0);
            SwitchRed sw = new SwitchRed();
            sw.setId(id);
            sw.setNombre(dto.getNombre());
            sw.setMarca(dto.getMarca());
            sw.setModelo(dto.getModelo());
            sw.setUbicacion(UbicacionRed.RACK_PRINCIPAL);
            when(switchRedRepository.findById(id)).thenReturn(sw);
            return null;
        }).when(switchRedRepository).aplicarHistorial(anyString(), captor.capture());

        SwitchRedDTO res = service.crear(dto, "user-uid-123");

        verify(switchRedRepository).aplicarHistorial(anyString(), any());
        assertNotNull(res);
        assertEquals("Switch Core 24p", res.getNombre());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        assertEquals("Switch Core 24p", plan.campos().get("nombre"));
        assertNotNull(plan.campos().get("historial"));
    }

    @Test
    void updateAplicaHistorialEdicionFicha() throws Exception {
        SwitchRed existente = new SwitchRed();
        existente.setId("sw-1");
        existente.setNombre("Switch Antiguo");
        existente.setUbicacion(UbicacionRed.RACK_PRINCIPAL);

        when(switchRedRepository.findById("sw-1")).thenReturn(existente);

        SwitchRedCreateDTO dto = new SwitchRedCreateDTO();
        dto.setNombre("Switch Nuevo");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());

        service.update("sw-1", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(switchRedRepository).aplicarHistorial(eq("sw-1"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("nombre", "Switch Antiguo", "ubicacion", "RACK_PRINCIPAL"), Timestamp.now());
        assertNotNull(plan);
        assertEquals("Switch Nuevo", plan.campos().get("nombre"));
    }

    @Test
    void cambiarEstadoAplicaHistorial() throws Exception {
        SwitchRed existente = new SwitchRed();
        existente.setId("sw-1");
        existente.setNombre("Switch 1");

        when(switchRedRepository.findById("sw-1")).thenReturn(existente);

        service.cambiarEstado("sw-1", "ACTIVA", "Mantenimiento finalizado", "admin-uid");

        verify(switchRedRepository).aplicarHistorial(eq("sw-1"), any());
    }
}
