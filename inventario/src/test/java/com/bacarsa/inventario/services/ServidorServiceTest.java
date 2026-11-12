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

import com.bacarsa.inventario.dto.ServidorDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Servidor;
import com.bacarsa.inventario.repository.ServidorRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class ServidorServiceTest {

    @Mock
    private ServidorRepository servidorRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private ServidorService service;

    @BeforeEach
    void setUp() {
        service = new ServidorService(servidorRepository, usuarioRepository);
    }

    @Test
    void crearAplicaHistorialAltaManual() throws Exception {
        ServidorDTO dto = new ServidorDTO();
        dto.setNombre("SRV-PROD-01");
        dto.setHostname("srvprod01.bacarsa.local");
        dto.setIp("10.0.0.10");
        dto.setSistemaOperativo("Ubuntu Server 24.04 LTS");
        dto.setUbicacion("Rack Central Data Center");
        dto.setEstado("activo");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            String id = inv.getArgument(0);
            Servidor s = new Servidor();
            s.setId(id);
            s.setNombre(dto.getNombre());
            s.setHostname(dto.getHostname());
            s.setIp(dto.getIp());
            s.setSistemaOperativo(dto.getSistemaOperativo());
            s.setUbicacion(dto.getUbicacion());
            s.setEstado("activo");
            when(servidorRepository.findById(id)).thenReturn(s);
            return null;
        }).when(servidorRepository).aplicarHistorial(anyString(), captor.capture());

        ServidorDTO res = service.crear(dto, "user-uid-123");

        verify(servidorRepository).aplicarHistorial(anyString(), any());
        assertNotNull(res);
        assertEquals("SRV-PROD-01", res.getNombre());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        assertEquals("SRV-PROD-01", plan.campos().get("nombre"));
        assertNotNull(plan.campos().get("historial"));
    }

    @Test
    void updateAplicaHistorialEdicionFicha() throws Exception {
        Servidor existente = new Servidor();
        existente.setId("srv-1");
        existente.setNombre("SRV-OLD");
        existente.setIp("10.0.0.10");
        existente.setEstado("activo");

        when(servidorRepository.findById("srv-1")).thenReturn(existente);

        ServidorDTO dto = new ServidorDTO();
        dto.setNombre("SRV-NEW");
        dto.setIp("10.0.0.11");
        dto.setEstado("activo");

        service.actualizar("srv-1", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(servidorRepository).aplicarHistorial(eq("srv-1"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("nombre", "SRV-OLD", "ip", "10.0.0.10", "estado", "activo"), Timestamp.now());
        assertNotNull(plan);
        assertEquals("SRV-NEW", plan.campos().get("nombre"));
        assertEquals("10.0.0.11", plan.campos().get("ip"));
    }

    @Test
    void cambiarEstadoAplicaHistorial() throws Exception {
        Servidor existente = new Servidor();
        existente.setId("srv-1");
        existente.setNombre("SRV-1");
        existente.setEstado("activo");

        when(servidorRepository.findById("srv-1")).thenReturn(existente);

        service.cambiarEstado("srv-1", "mantenimiento", "Actualización de kernel", "admin-uid");

        verify(servidorRepository).aplicarHistorial(eq("srv-1"), any());
    }
}
