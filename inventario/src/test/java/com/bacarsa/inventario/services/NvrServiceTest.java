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
import java.util.function.BiFunction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.NvrCreateDTO;
import com.bacarsa.inventario.dto.NvrDTO;
import com.bacarsa.inventario.historial.EscrituraHistorial;
import com.bacarsa.inventario.models.Nvr;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.NvrRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;
import com.bacarsa.inventario.security.CredencialCryptoService;
import com.google.cloud.Timestamp;

@ExtendWith(MockitoExtension.class)
class NvrServiceTest {

    @Mock
    private NvrRepository nvrRepository;

    @Mock
    private CamaraRepository camaraRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private CredencialCryptoService cryptoService;
    private NvrService service;

    @BeforeEach
    void setUp() {
        cryptoService = new CredencialCryptoService("secret-nvr-test-key-32bytes!!");
        service = new NvrService(nvrRepository, camaraRepository, cryptoService, usuarioRepository);
    }

    @Test
    void crearCifraPasswordAlGuardarYDescifraAlConsultar() throws Exception {
        NvrCreateDTO dto = new NvrCreateDTO();
        dto.setDispositivo("NVR-PISO1");
        dto.setNombre("NVR Piso 1");
        dto.setUsuario("admin");
        dto.setPassword("NvrAdminPass789");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);

        doAnswer(inv -> {
            BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = inv.getArgument(1);
            EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
            Nvr n = new Nvr();
            n.setId("NVR-PISO1");
            n.setNombre((String) plan.campos().get("nombre"));
            n.setUsuario((String) plan.campos().get("usuario"));
            n.setPassword((String) plan.campos().get("password"));
            when(nvrRepository.findById("NVR-PISO1")).thenReturn(n);
            return null;
        }).when(nvrRepository).aplicarHistorial(eq("NVR-PISO1"), captor.capture());

        NvrDTO res = service.crear(dto, "user-uid-123");

        verify(nvrRepository).aplicarHistorial(eq("NVR-PISO1"), any());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(null, Timestamp.now());
        assertNotNull(plan);
        String passEnRepo = (String) plan.campos().get("password");
        assertNotNull(passEnRepo);
        assertTrue(passEnRepo.startsWith("ENC:"));

        assertNotNull(res);
        assertEquals("NvrAdminPass789", res.getPassword());
    }

    @Test
    void updateCifraPasswordEnCamposYAplicaHistorial() throws Exception {
        Nvr existente = new Nvr();
        existente.setId("NVR-01");
        existente.setNombre("NVR 01");

        when(nvrRepository.findById("NVR-01")).thenReturn(existente);

        NvrCreateDTO dto = new NvrCreateDTO();
        dto.setDispositivo("NVR-01");
        dto.setNombre("NVR 01 Edit");
        dto.setPassword("NewNvrPass321");

        service.update("NVR-01", dto, "admin-uid");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial>> captor = ArgumentCaptor.forClass(BiFunction.class);
        verify(nvrRepository).aplicarHistorial(eq("NVR-01"), captor.capture());

        BiFunction<Map<String, Object>, Timestamp, EscrituraHistorial> planFn = captor.getValue();
        EscrituraHistorial plan = planFn.apply(Map.of("nombre", "NVR 01"), Timestamp.now());
        assertNotNull(plan);

        String passEnRepo = (String) plan.campos().get("password");
        assertNotNull(passEnRepo);
        assertTrue(passEnRepo.startsWith("ENC:"));
        assertEquals("NewNvrPass321", cryptoService.descifrar(passEnRepo));
    }

    @Test
    void eliminarHaceBajaLogica() throws Exception {
        Nvr existente = new Nvr();
        existente.setId("NVR-01");
        existente.setNombre("NVR 01");
        existente.setEstado("activo");

        when(nvrRepository.findById("NVR-01")).thenReturn(existente);

        boolean ok = service.eliminar("NVR-01", "admin-uid");

        assertTrue(ok);
        verify(nvrRepository).aplicarHistorial(eq("NVR-01"), any());
    }
}
