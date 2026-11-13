package com.bacarsa.inventario.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bacarsa.inventario.dto.MigracionStockFichasResultDTO;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;

@ExtendWith(MockitoExtension.class)
class MigracionStockFichasServiceTest {

    @Mock
    private StockUnidadesService stockUnidadesService;

    @Mock
    private StockFichaRepository stockFichaRepository;

    @Mock
    private MovimientoStockRepository movimientoStockRepository;

    private MigracionStockFichasService service;

    @BeforeEach
    void setUp() {
        service = new MigracionStockFichasService(stockUnidadesService, stockFichaRepository, movimientoStockRepository);
    }

    @Test
    void migrar_creaFichasYVinculaMovimientos() throws Exception {
        FichaLectura ficha1 = FichaLectura.de(
                "perifericos_manuales",
                "pm-1",
                "NB-0042",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14 Gen3",
                "PF123456",
                "USADA",
                "DISPONIBLE",
                "2026-01-01",
                "Depósito Sistemas");

        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha1));
        when(stockFichaRepository.findById("NB-0042")).thenReturn(null);

        MovimientoStock mov1 = new MovimientoStock();
        mov1.setId("mov-1");
        mov1.setCodigo("NB-0042");
        mov1.setFichaCodigo(null);

        MovimientoStock mov2 = new MovimientoStock();
        mov2.setId("mov-2");
        mov2.setCodigo("NB-0042");
        mov2.setFichaCodigo("NB-0042"); // ya vinculado

        when(movimientoStockRepository.findAll()).thenReturn(List.of(mov1, mov2));

        MigracionStockFichasResultDTO res = service.migrar(false);

        assertEquals(1, res.getFichasCreadas());
        assertEquals(0, res.getFichasOmitidas());
        assertEquals(1, res.getMovimientosVinculados());

        verify(stockFichaRepository, times(1)).save(argThat(f ->
                "NB-0042".equals(f.getCodigoInterno()) &&
                "NOTEBOOK".equals(f.getTipo()) &&
                "EN_DEPOSITO".equals(f.getEstado()) &&
                "Lenovo ThinkPad L14 Gen3".equals(f.getDescripcion()) &&
                "perifericos_manuales/pm-1".equals(f.getRefOrigen())
        ));

        verify(movimientoStockRepository, times(1)).update(eq("mov-1"), eq(Map.of("ficha_codigo", "NB-0042")));
        verify(movimientoStockRepository, never()).update(eq("mov-2"), any());
    }

    @Test
    void migrar_omiteFichasExistentesSiNoSobrescribe() throws Exception {
        FichaLectura ficha1 = FichaLectura.de(
                "perifericos_manuales",
                "pm-1",
                "NB-0042",
                "NB",
                null,
                "notebook",
                "Lenovo",
                "ThinkPad L14 Gen3",
                "PF123456",
                "USADA",
                "DISPONIBLE",
                "2026-01-01",
                "Depósito Sistemas");

        when(stockUnidadesService.leerFichas()).thenReturn(List.of(ficha1));
        when(stockFichaRepository.findById("NB-0042")).thenReturn(StockFicha.builder().codigoInterno("NB-0042").build());
        when(movimientoStockRepository.findAll()).thenReturn(List.of());

        MigracionStockFichasResultDTO res = service.migrar(false);

        assertEquals(0, res.getFichasCreadas());
        assertEquals(1, res.getFichasOmitidas());
        verify(stockFichaRepository, never()).save(any());
    }
}
