package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

import com.bacarsa.inventario.dto.CelularCreateDTO;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.repository.CelularRepository;

@ExtendWith(MockitoExtension.class)
class CelularServiceTest {

    @Mock
    private CelularRepository celularRepository;

    private CelularService service;

    @BeforeEach
    void setUp() {
        service = new CelularService(celularRepository);
    }

    @Test
    void crearNormalizaImeiYAplicaDefaultsDeStock() throws Exception {
        Celular persistido = celular("nuevo-id", "123456");
        persistido.setConCargador(true);
        persistido.setCondicion("nuevo");
        persistido.setArea("Depósito");
        persistido.setEstado("en_stock");

        when(celularRepository.findAll()).thenReturn(List.of());
        when(celularRepository.create(any(Celular.class))).thenReturn("nuevo-id");
        when(celularRepository.findById("nuevo-id")).thenReturn(persistido);

        service.crear(request("123-456", true, "NUEVO", null, null));

        ArgumentCaptor<Celular> captor = ArgumentCaptor.forClass(Celular.class);
        verify(celularRepository).create(captor.capture());
        Celular creado = captor.getValue();
        assertEquals("123456", creado.getImei());
        assertEquals(true, creado.getConCargador());
        assertEquals("nuevo", creado.getCondicion());
        assertEquals("Depósito", creado.getArea());
        assertEquals("en_stock", creado.getEstado());
    }

    @Test
    void crearRechazaImeiDuplicadoNormalizado() throws Exception {
        when(celularRepository.findAll()).thenReturn(List.of(celular("existente", "123-456")));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> service.crear(request("123456", false, "usado", "Depósito", "en_stock")));

        assertEquals("Ya existe un celular con el IMEI 123456", error.getMessage());
        verify(celularRepository, never()).create(any(Celular.class));
    }

    @Test
    void updatePermiteElMismoImeiYGuardaCamposNuevos() throws Exception {
        Celular existente = celular("cel-1", "123456");
        when(celularRepository.findById("cel-1")).thenReturn(existente);
        when(celularRepository.findAll()).thenReturn(List.of(existente));

        service.update("cel-1", request("123456", false, "usado", "Depósito", "en_stock"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(celularRepository).update(eq("cel-1"), captor.capture());
        assertEquals(false, captor.getValue().get("con_cargador"));
        assertEquals("usado", captor.getValue().get("condicion"));
        assertEquals("123456", captor.getValue().get("imei"));
    }

    @Test
    void updateRechazaImeiDeOtroCelular() throws Exception {
        Celular actual = celular("cel-1", "111111");
        Celular otro = celular("cel-2", "222222");
        when(celularRepository.findById("cel-1")).thenReturn(actual);
        when(celularRepository.findAll()).thenReturn(List.of(actual, otro));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.update(
                        "cel-1",
                        request("222222", true, "nuevo", "Depósito", "en_stock")));

        verify(celularRepository, never()).update(eq("cel-1"), any());
    }

    private static CelularCreateDTO request(
            String imei,
            boolean conCargador,
            String condicion,
            String area,
            String estado) {
        CelularCreateDTO dto = new CelularCreateDTO();
        dto.setMarca("Samsung");
        dto.setModelo("A15");
        dto.setImei(imei);
        dto.setConCargador(conCargador);
        dto.setCondicion(condicion);
        dto.setArea(area);
        dto.setEstado(estado);
        return dto;
    }

    private static Celular celular(String id, String imei) {
        Celular celular = new Celular();
        celular.setId(id);
        celular.setMarca("Samsung");
        celular.setModelo("A15");
        celular.setImei(imei);
        return celular;
    }
}
