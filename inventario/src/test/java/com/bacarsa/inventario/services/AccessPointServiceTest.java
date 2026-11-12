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

import com.bacarsa.inventario.dto.AccessPointCreateDTO;
import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class AccessPointServiceTest {

    @Mock
    private AccessPointRepository accessPointRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private AccessPointService service;

    @BeforeEach
    void setUp() {
        service = new AccessPointService(accessPointRepository, usuarioRepository);
    }

    @Test
    void crearAplicaHistorialAltaManual() throws Exception {
        AccessPointCreateDTO dto = new AccessPointCreateDTO();
        dto.setNombre("AP Pasillo Principal");
        dto.setMarca("Ubiquiti");
        dto.setModelo("UniFi 6 Pro");
        dto.setIp("192.168.1.50");
        dto.setMac("AA:BB:CC:DD:EE:FF");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());
        dto.setEstado("OPERATIVO");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            String id = inv.getArgument(0);
            AccessPoint ap = new AccessPoint();
            ap.setId(id);
            ap.setNombre(dto.getNombre());
            ap.setMarca(dto.getMarca());
            ap.setModelo(dto.getModelo());
            ap.setUbicacion(UbicacionRed.RACK_PRINCIPAL);
            ap.setEstado("OPERATIVO");
            when(accessPointRepository.findById(id)).thenReturn(ap);
            return null;
        }).when(accessPointRepository).aplicarHistorial(anyString(), captor.capture());

        AccessPointDTO res = service.crear(dto, "user-uid-123");

        verify(accessPointRepository).aplicarHistorial(anyString(), any());
        assertNotNull(res);
        assertEquals("AP Pasillo Principal", res.getNombre());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        assertEquals("AP Pasillo Principal", plan.campos().get("nombre"));
        assertNotNull(plan.campos().get("historial"));
    }

    @Test
    void updateAplicaHistorialEdicionFicha() throws Exception {
        AccessPoint existente = new AccessPoint();
        existente.setId("ap-1");
        existente.setNombre("AP Antiguo");
        existente.setUbicacion(UbicacionRed.RACK_PRINCIPAL);

        when(accessPointRepository.findById("ap-1")).thenReturn(existente);

        AccessPointCreateDTO dto = new AccessPointCreateDTO();
        dto.setNombre("AP Nuevo");
        dto.setUbicacion(UbicacionRed.RACK_PRINCIPAL.name());

        service.update("ap-1", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(accessPointRepository).aplicarHistorial(eq("ap-1"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("nombre", "AP Antiguo", "ubicacion", "RACK_PRINCIPAL"), Timestamp.now());
        assertNotNull(plan);
        assertEquals("AP Nuevo", plan.campos().get("nombre"));
    }

    @Test
    void cambiarEstadoAplicaHistorial() throws Exception {
        AccessPoint existente = new AccessPoint();
        existente.setId("ap-1");
        existente.setNombre("AP 1");
        existente.setEstado("OPERATIVO");

        when(accessPointRepository.findById("ap-1")).thenReturn(existente);

        service.cambiarEstado("ap-1", "EN_MANTENIMIENTO", "Reinicio de firmware", "admin-uid");

        verify(accessPointRepository).aplicarHistorial(eq("ap-1"), any());
    }
}
