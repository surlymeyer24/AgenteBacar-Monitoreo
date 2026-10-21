package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class StockUnidadesService {

    private static final Logger log = LoggerFactory.getLogger(StockUnidadesService.class);

    private final PerifericoManualRepository perifericoManualRepository;
    private final CelularRepository celularRepository;
    private final ComputadoraRepository computadoraRepository;

    public StockUnidadesService(
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            ComputadoraRepository computadoraRepository) {
        this.perifericoManualRepository = perifericoManualRepository;
        this.celularRepository = celularRepository;
        this.computadoraRepository = computadoraRepository;
    }

    public List<UnidadStockDTO> listar() {
        List<UnidadStockDTO> salida = new ArrayList<>();
        for (FichaLectura ficha : leerFichas()) {
            if (!ficha.entraEnListado()) {
                log.warn("Stock: unidad omitida {}", ficha.referencia());
                continue;
            }
            salida.add(ficha.aDto());
        }
        return salida;
    }

    public void backfill() {
        CodigoInternoBackfill.Resultado resultado = CodigoInternoBackfill.ejecutar(leerFichas(), this::escribir);
        for (String omitido : resultado.omitidos()) {
            log.warn("Stock: backfill omite {}", omitido);
        }
        for (String fallo : resultado.fallos()) {
            log.error("Stock: backfill fallo {}", fallo);
        }
        log.info("Stock: backfill escritos={}", resultado.escritos());
    }

    private void escribir(String coleccion, String id, String codigo) throws Exception {
        if (ColeccionesStock.CELULARES.equals(coleccion)) {
            celularRepository.mergeCodigoInterno(id, codigo);
        } else {
            perifericoManualRepository.mergeCodigoInterno(id, codigo);
        }
    }

    public UnidadStockDTO obtenerPorCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        for (FichaLectura ficha : leerFichas()) {
            if (codigo.trim().equalsIgnoreCase(ficha.getCodigoInterno()) || codigo.trim().equalsIgnoreCase(ficha.getId())) {
                return ficha.aDto();
            }
        }
        throw new IllegalArgumentException("Unidad de stock no encontrada con código: " + codigo);
    }

    public List<FichaLectura> leerFichas() {
        List<FichaLectura> fichas = new ArrayList<>();
        for (PerifericoManual periferico : leer(ColeccionesStock.PERIFERICOS_MANUALES, perifericoManualRepository::findAll)) {
            if (periferico != null) {
                fichas.add(ProyeccionStock.desdePeriferico(periferico));
            }
        }
        for (Celular celular : leer(ColeccionesStock.CELULARES, celularRepository::findAll)) {
            if (celular != null) {
                fichas.add(ProyeccionStock.desdeCelular(celular));
            }
        }
        for (Computadora pc : leer(ColeccionesStock.COMPUTADORAS, computadoraRepository::findAll)) {
            if (pc != null) {
                fichas.add(ProyeccionStock.desdeComputadora(pc));
            }
        }
        return fichas;
    }

    private <T> List<T> leer(String coleccion, Lectura<T> lectura) {
        if (Thread.currentThread().isInterrupted()) {
            log.error("Stock: lectura interrumpida coleccion={}", coleccion);
            return List.of();
        }
        try {
            List<T> lista = lectura.leer();
            return lista == null ? List.of() : lista;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Stock: lectura interrumpida coleccion={}", coleccion);
            return List.of();
        } catch (Exception ex) {
            log.error("Stock: no se pudo leer coleccion={}", coleccion);
            return List.of();
        }
    }

    @FunctionalInterface
    private interface Lectura<T> {
        List<T> leer() throws ExecutionException, InterruptedException;
    }
}
