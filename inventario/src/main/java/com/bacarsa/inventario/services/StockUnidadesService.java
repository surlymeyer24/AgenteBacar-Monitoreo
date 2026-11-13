package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;

@Service
public class StockUnidadesService {

    private static final Logger log = LoggerFactory.getLogger(StockUnidadesService.class);

    private final PerifericoManualRepository perifericoManualRepository;
    private final CelularRepository celularRepository;
    private final ComputadoraRepository computadoraRepository;
    private final StockFichaRepository stockFichaRepository;

    public StockUnidadesService(
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            ComputadoraRepository computadoraRepository) {
        this(perifericoManualRepository, celularRepository, computadoraRepository, null);
    }

    @Autowired
    public StockUnidadesService(
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            ComputadoraRepository computadoraRepository,
            StockFichaRepository stockFichaRepository) {
        this.perifericoManualRepository = perifericoManualRepository;
        this.celularRepository = celularRepository;
        this.computadoraRepository = computadoraRepository;
        this.stockFichaRepository = stockFichaRepository;
    }

    public List<UnidadStockDTO> listar() {
        if (stockFichaRepository != null) {
            try {
                List<StockFicha> fichas = stockFichaRepository.findAll();
                if (fichas != null && !fichas.isEmpty()) {
                    List<UnidadStockDTO> dtos = new ArrayList<>();
                    for (StockFicha ficha : fichas) {
                        if (ficha != null && !"REEMPLAZADA".equalsIgnoreCase(ficha.getEstado())) {
                            dtos.add(aDto(ficha));
                        }
                    }
                    return dtos;
                }
            } catch (Exception ex) {
                log.error("Stock: error al leer de stock_fichas, recurriendo a proyección legacy", ex);
            }
        }

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
        String codigoLimpio = codigo.trim();

        if (stockFichaRepository != null) {
            try {
                StockFicha ficha = stockFichaRepository.findById(codigoLimpio);
                if (ficha != null) {
                    return aDto(ficha);
                }
            } catch (Exception ex) {
                log.error("Stock: error al buscar por codigo en stock_fichas {}", codigoLimpio, ex);
            }
        }

        for (FichaLectura ficha : leerFichas()) {
            if (codigoLimpio.equalsIgnoreCase(ficha.getCodigoInterno()) || codigoLimpio.equalsIgnoreCase(ficha.getId())) {
                return ficha.aDto();
            }
        }
        int idxHija = codigoLimpio.toUpperCase(Locale.ROOT).lastIndexOf("-A");
        if (idxHija > 0) {
            String loteBase = codigoLimpio.substring(0, idxHija);
            for (FichaLectura ficha : leerFichas()) {
                if (loteBase.equalsIgnoreCase(ficha.getCodigoInterno()) || loteBase.equalsIgnoreCase(ficha.getId())) {
                    UnidadStockDTO dto = ficha.aDto();
                    dto.setCodigo(codigoLimpio);
                    dto.setLoteOrigen(ficha.getCodigoInterno());
                    dto.setEstadoDeposito("ASIGNADA");
                    return dto;
                }
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

    public static UnidadStockDTO aDto(StockFicha ficha) {
        if (ficha == null) return null;
        UnidadStockDTO dto = new UnidadStockDTO();
        dto.setId(ficha.getCodigoInterno());
        dto.setCodigo(ficha.getCodigoInterno());
        dto.setColeccion("stock_fichas");
        dto.setTipo(ficha.getTipo() != null ? ficha.getTipo().toLowerCase(Locale.ROOT) : "");
        dto.setTipoEquipo(ficha.getTipo() != null ? ficha.getTipo().toLowerCase(Locale.ROOT) : "");
        dto.setMarca(ficha.getMarca() != null ? ficha.getMarca() : "");
        dto.setModelo(ficha.getModelo() != null ? ficha.getModelo() : "");
        dto.setSerieOImei(ficha.getSerieOImei() != null ? ficha.getSerieOImei() : "");
        dto.setCondicion(ficha.getCondicion() != null ? ficha.getCondicion() : "USADA");
        dto.setEstadoDeposito(ficha.getEstado() != null ? ficha.getEstado() : "EN_DEPOSITO");
        dto.setFechaIngreso(ficha.getCreatedAt() != null ? ficha.getCreatedAt().toString() : "");
        dto.setUbicacion(ficha.getUbicacion() != null ? ficha.getUbicacion() : "");
        dto.setCantidad(ficha.getCantidad() != null ? ficha.getCantidad() : 1);
        dto.setLoteOrigen(ficha.getLoteOrigen());
        dto.setComentarios(ficha.getNotas() != null ? ficha.getNotas() : "");
        dto.setDescripcionCompleta(ficha.getDescripcion() != null ? ficha.getDescripcion() : "");
        return dto;
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
