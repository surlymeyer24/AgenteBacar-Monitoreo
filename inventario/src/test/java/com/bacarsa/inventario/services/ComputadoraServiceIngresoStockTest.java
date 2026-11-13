package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.bacarsa.inventario.dto.IngresarStockDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;

class ComputadoraServiceIngresoStockTest {

    private final ComputadoraRepository repo = mock(ComputadoraRepository.class);
    private final ResponsableService responsables = mock(ResponsableService.class);
    private final ComputadoraHistorialService historial = mock(ComputadoraHistorialService.class);
    private final StockFichaRepository fichas = mock(StockFichaRepository.class);
    private final StockUnidadesService unidades = mock(StockUnidadesService.class);
    private final ComputadoraService service =
            new ComputadoraService(repo, responsables, historial, fichas, unidades);

    private Computadora pcSinCodigo() {
        Computadora pc = new Computadora();
        pc.setUuid("SURLY-PC");
        pc.setHostname("SURLY-PC");
        return pc;
    }

    @Test
    @SuppressWarnings("unchecked")
    void conStockFichasVaciaGuardaCodigoEnLaPcPeroNoCreaFicha() throws Exception {
        when(repo.findByUuid("SURLY-PC")).thenReturn(pcSinCodigo());
        when(fichas.findAll()).thenReturn(List.of());
        FichaLectura legacy = mock(FichaLectura.class);
        when(legacy.getCodigoInterno()).thenReturn("PC-23");
        when(unidades.leerFichas()).thenReturn(List.of(legacy));

        service.ingresarStock("SURLY-PC", new IngresarStockDTO(), "uid");

        ArgumentCaptor<Map<String, Object>> ficha = ArgumentCaptor.forClass(Map.class);
        verify(historial).cambiarEstado(eq("SURLY-PC"), eq("SIN_ASIGNAR"), anyString(), ficha.capture(), eq("uid"));
        assertEquals("PC-24", ficha.getValue().get("codigo_interno"));
        verify(fichas, never()).save(any(StockFicha.class));
    }

    @Test
    void conStockFichasEnUsoCreaLaFichaConElCodigo() throws Exception {
        when(repo.findByUuid("SURLY-PC")).thenReturn(pcSinCodigo());
        StockFicha otra = StockFicha.builder().codigoInterno("MON-1").estado("EN_DEPOSITO").build();
        when(fichas.findAll()).thenReturn(List.of(otra));
        when(unidades.leerFichas()).thenReturn(List.of());

        service.ingresarStock("SURLY-PC", new IngresarStockDTO(), "uid");

        ArgumentCaptor<StockFicha> guardada = ArgumentCaptor.forClass(StockFicha.class);
        verify(fichas).save(guardada.capture());
        assertEquals("PC-1", guardada.getValue().getCodigoInterno());
        assertEquals("EN_DEPOSITO", guardada.getValue().getEstado());
    }
}
