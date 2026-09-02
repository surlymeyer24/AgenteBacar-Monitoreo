package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ActualizarProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.dto.EtiquetaQrDetalleDTO;
import com.bacarsa.inventario.dto.EtiquetaQrItemDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaDTO;
import com.bacarsa.inventario.dto.ProgresoLogisticaResumenDTO;
import com.bacarsa.inventario.dto.ResultadoProgresoLogisticaMasivoDTO;
import com.bacarsa.inventario.dto.UsuarioAuditoriaDTO;
import com.bacarsa.inventario.models.Usuario;
import com.bacarsa.inventario.repository.ProgresoLogisticaRepository;
import com.bacarsa.inventario.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ProgresoLogisticaServiceTest {

    @Mock
    private ProgresoLogisticaRepository progresoRepository;
    @Mock
    private EtiquetaQrService etiquetaQrService;
    @Mock
    private UsuarioRepository usuarioRepository;

    private ProgresoLogisticaService service;

    @BeforeEach
    void setUp() {
        service = new ProgresoLogisticaService(
                progresoRepository, etiquetaQrService, usuarioRepository);
    }

    @Test
    void actualizarGuardaElUsuarioQueRealizoLaAccion() throws Exception {
        String uuid = "pc-1";
        String uid = "uid-123";
        Usuario usuario = new Usuario();
        usuario.setId(uid);
        usuario.setNombre("Agustina");
        usuario.setEmail("agustina@bacarsa.com");

        ActualizarProgresoLogisticaDTO request = requestValido();
        ProgresoLogisticaDTO esperado = new ProgresoLogisticaDTO();
        esperado.setUuid(uuid);

        when(etiquetaQrService.obtenerPorUuid(uuid)).thenReturn(ficha(uuid));
        when(usuarioRepository.findById(uid)).thenReturn(Optional.of(usuario));
        when(progresoRepository.findByUuid(uuid)).thenReturn(esperado);

        ProgresoLogisticaDTO resultado = service.actualizar(uuid, request, uid);

        assertEquals(uuid, resultado.getUuid());
        verify(progresoRepository).actualizar(
                eq(uuid),
                eq("etiquetado"),
                eq(List.of("mon-0-Monitor Dell")),
                eq(true),
                eq(List.of("pc-pc-1", "mon-0-Monitor Dell")),
                eq(new UsuarioAuditoriaDTO(uid, "Agustina", "agustina@bacarsa.com")));
    }

    @Test
    void actualizarRechazaUnaFaseDesconocida() throws Exception {
        ActualizarProgresoLogisticaDTO request = requestValido();
        request.setFase("mudado");
        when(etiquetaQrService.obtenerPorUuid("pc-1")).thenReturn(ficha("pc-1"));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.actualizar("pc-1", request, "uid-123"));
    }

    @Test
    void actualizarRechazaItemsAjenosALaFicha() throws Exception {
        ActualizarProgresoLogisticaDTO request = requestValido();
        request.setItemIds(List.of("elemento-ajeno"));
        when(etiquetaQrService.obtenerPorUuid("pc-1")).thenReturn(ficha("pc-1"));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.actualizar("pc-1", request, "uid-123"));
    }

    @Test
    void listarResumenDelegaEnLaProyeccionLiviana() throws Exception {
        Map<String, ProgresoLogisticaResumenDTO> esperado = Map.of(
                "pc-1", new ProgresoLogisticaResumenDTO("pc-1", 100, 50, 0, "EN_CURSO"));
        when(progresoRepository.findAllResumen()).thenReturn(esperado);

        assertSame(esperado, service.listarResumen());
    }

    @Test
    void obtenerValidaExistenciaSinConstruirLaFichaCompleta() throws Exception {
        ProgresoLogisticaDTO esperado = new ProgresoLogisticaDTO();
        esperado.setUuid("pc-1");
        when(etiquetaQrService.existeUuid("pc-1")).thenReturn(true);
        when(progresoRepository.findByUuid("pc-1")).thenReturn(esperado);

        assertSame(esperado, service.obtener("pc-1"));
        verify(etiquetaQrService).existeUuid("pc-1");
    }

    @Test
    void obtenerDevuelveNullCuandoNoExisteLaComputadora() throws Exception {
        when(etiquetaQrService.existeUuid("inexistente")).thenReturn(false);

        assertNull(service.obtener("inexistente"));
    }

    @Test
    void actualizarMasivoAplicaCadaFaseSobreTodosLosItemsDelPuesto() throws Exception {
        String uid = "uid-123";
        Usuario usuario = new Usuario();
        usuario.setId(uid);
        usuario.setNombre("Agustina");
        usuario.setEmail("agustina@bacarsa.com");

        ActualizarProgresoLogisticaMasivoDTO request = new ActualizarProgresoLogisticaMasivoDTO();
        request.setUuids(List.of("pc-1", "inexistente"));
        request.setFases(List.of("etiquetado", "embalado"));
        request.setCompletado(true);

        when(usuarioRepository.findById(uid)).thenReturn(Optional.of(usuario));
        when(etiquetaQrService.obtenerPorUuid("pc-1")).thenReturn(ficha("pc-1"));
        when(etiquetaQrService.obtenerPorUuid("inexistente")).thenReturn(null);

        ResultadoProgresoLogisticaMasivoDTO resultado = service.actualizarMasivo(request, uid);

        assertEquals(1, resultado.getActualizados());
        assertEquals(List.of("inexistente"), resultado.getOmitidos());
        List<String> todosLosIds = List.of("pc-pc-1", "mon-0-Monitor Dell");
        UsuarioAuditoriaDTO actor = new UsuarioAuditoriaDTO(uid, "Agustina", "agustina@bacarsa.com");
        verify(progresoRepository).actualizar(
                eq("pc-1"), eq("etiquetado"), eq(todosLosIds), eq(true), eq(todosLosIds), eq(actor));
        verify(progresoRepository).actualizar(
                eq("pc-1"), eq("embalado"), eq(todosLosIds), eq(true), eq(todosLosIds), eq(actor));
    }

    @Test
    void actualizarMasivoRechazaUnaFaseDesconocida() {
        ActualizarProgresoLogisticaMasivoDTO request = new ActualizarProgresoLogisticaMasivoDTO();
        request.setUuids(List.of("pc-1"));
        request.setFases(List.of("mudado"));
        request.setCompletado(true);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.actualizarMasivo(request, "uid-123"));
    }

    private static ActualizarProgresoLogisticaDTO requestValido() {
        ActualizarProgresoLogisticaDTO request = new ActualizarProgresoLogisticaDTO();
        request.setFase("etiquetado");
        request.setItemIds(List.of("mon-0-Monitor Dell"));
        request.setCompletado(true);
        return request;
    }

    private static EtiquetaQrDetalleDTO ficha(String uuid) {
        EtiquetaQrDetalleDTO ficha = new EtiquetaQrDetalleDTO();
        ficha.setUuid(uuid);
        ficha.setMonitores(List.of(
                new EtiquetaQrItemDTO("Monitor", "Monitor Dell", "1920x1080")));
        ficha.setPerifericos(List.of());
        return ficha;
    }
}
