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

import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class RouterServiceTest {

    @Mock
    private RouterRepository routerRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private RouterService service;

    @BeforeEach
    void setUp() {
        service = new RouterService(routerRepository, usuarioRepository);
    }

    @Test
    void crearAplicaHistorialAltaManual() throws Exception {
        RouterCreateDTO dto = new RouterCreateDTO();
        dto.setNombre("Router Core");
        dto.setMarca("MikroTik");
        dto.setModelo("CCR1009");
        dto.setIp("192.168.1.1");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());
        dto.setCantidadPuertosWan(2);
        dto.setCantidadPuertosLan(8);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            String id = inv.getArgument(0);
            Router r = new Router();
            r.setId(id);
            r.setNombre(dto.getNombre());
            r.setMarca(dto.getMarca());
            r.setModelo(dto.getModelo());
            r.setUbicacion(UbicacionRed.RACK_PRINCIPAL);
            when(routerRepository.findById(id)).thenReturn(r);
            return null;
        }).when(routerRepository).aplicarHistorial(anyString(), captor.capture());

        RouterDTO res = service.crear(dto, "user-uid-123");

        verify(routerRepository).aplicarHistorial(anyString(), any());
        assertNotNull(res);
        assertEquals("Router Core", res.getNombre());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        assertEquals("Router Core", plan.campos().get("nombre"));
        assertNotNull(plan.campos().get("historial"));
    }

    @Test
    void updateAplicaHistorialEdicionFicha() throws Exception {
        Router existente = new Router();
        existente.setId("router-1");
        existente.setNombre("Router Antiguo");
        existente.setUbicacion(UbicacionRed.RACK_PRINCIPAL);

        when(routerRepository.findById("router-1")).thenReturn(existente);

        RouterCreateDTO dto = new RouterCreateDTO();
        dto.setNombre("Router Nuevo");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());

        service.update("router-1", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(routerRepository).aplicarHistorial(eq("router-1"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("nombre", "Router Antiguo", "ubicacion", "RACK_PRINCIPAL"), Timestamp.now());
        assertNotNull(plan);
        assertEquals("Router Nuevo", plan.campos().get("nombre"));
    }

    @Test
    void cambiarEstadoAplicaHistorial() throws Exception {
        Router existente = new Router();
        existente.setId("router-1");
        existente.setNombre("Router 1");

        when(routerRepository.findById("router-1")).thenReturn(existente);

        service.cambiarEstado("router-1", "ACTIVA", "Reactivación de enlace", "admin-uid");

        verify(routerRepository).aplicarHistorial(eq("router-1"), any());
    }
}
