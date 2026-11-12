package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.BiFunction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.CamaraCreateDTO;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.bacarsa.inventario.security.CredencialCryptoService;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class CamaraServiceTest {

    @Mock
    private CamaraRepository camaraRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private CredencialCryptoService cryptoService;
    private CamaraService service;

    @BeforeEach
    void setUp() {
        cryptoService = new CredencialCryptoService("secret-camara-test-key-32bytes!!");
        service = new CamaraService(camaraRepository, cryptoService, usuarioRepository);
    }

    @Test
    void crearCifraPasswordAlGuardarYDescifraAlConsultar() throws Exception {
        CamaraCreateDTO dto = new CamaraCreateDTO();
        dto.setDispositivo("CAM-PTZ-01");
        dto.setNombre("Cámara Entrada");
        dto.setUbicacion("Acceso Principal");
        dto.setUsuario("admin");
        dto.setPassword("SecretPass123");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = inv.getArgument(1);
            EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
            Camara c = new Camara();
            c.setId("CAM-PTZ-01");
            c.setNombre((String) plan.campos().get("nombre"));
            c.setUbicacion((String) plan.campos().get("ubicacion"));
            c.setUsuario((String) plan.campos().get("usuario"));
            c.setPassword((String) plan.campos().get("password"));
            when(camaraRepository.findById("CAM-PTZ-01")).thenReturn(c);
            return null;
        }).when(camaraRepository).aplicarHistorial(eq("CAM-PTZ-01"), captor.capture());

        CamaraDTO res = service.crear(dto);

        verify(camaraRepository).aplicarHistorial(eq("CAM-PTZ-01"), any());

        // Verificamos el plan generado
        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        String passEnRepo = (String) plan.campos().get("password");
        assertNotNull(passEnRepo);
        assertTrue(passEnRepo.startsWith("ENC:"));

        // Al DTO entregado debe estar descifrado en texto plano
        assertNotNull(res);
        assertEquals("SecretPass123", res.getPassword());
    }

    @Test
    void updateCifraPasswordEnCamposYAplicaHistorial() throws Exception {
        Camara existente = new Camara();
        existente.setId("CAM-01");
        existente.setNombre("Cam 01");
        existente.setUbicacion("Depósito");

        when(camaraRepository.findById("CAM-01")).thenReturn(existente);

        CamaraCreateDTO dto = new CamaraCreateDTO();
        dto.setDispositivo("CAM-01");
        dto.setNombre("Cam 01 Edit");
        dto.setUbicacion("Depósito Modificado");
        dto.setPassword("NewPassword456");

        service.update("CAM-01", dto);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(camaraRepository).aplicarHistorial(eq("CAM-01"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> funcion = captor.getValue();
        EscrituraHistorial plan = funcion.apply(Map.of("nombre", "Cam 01", "ubicacion", "Depósito"), Timestamp.now());
        assertNotNull(plan);

        Map<String, Object> campos = plan.campos();
        String passEnRepo = (String) campos.get("password");
        assertNotNull(passEnRepo);
        assertTrue(passEnRepo.startsWith("ENC:"));
        assertEquals("NewPassword456", cryptoService.descifrar(passEnRepo));
    }

    @Test
    void obtenerPorIdDescifraTextoLegacyEnClaro() throws Exception {
        Camara legacy = new Camara();
        legacy.setId("CAM-LEGACY");
        legacy.setNombre("Cam Legacy");
        legacy.setUbicacion("Recepción");
        legacy.setPassword("PasswordEnClaroAntigua");

        when(camaraRepository.findById("CAM-LEGACY")).thenReturn(legacy);

        CamaraDTO dto = service.obtenerPorId("CAM-LEGACY");

        assertNotNull(dto);
        assertEquals("PasswordEnClaroAntigua", dto.getPassword());
    }
}
