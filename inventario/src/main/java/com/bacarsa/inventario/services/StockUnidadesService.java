package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.Televisor;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MergeCodigoInterno;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@Service
public class StockUnidadesService {

    private static final Logger log = LoggerFactory.getLogger(StockUnidadesService.class);

    private final ComputadoraRepository computadoraRepository;
    private final PerifericoManualRepository perifericoManualRepository;
    private final CelularRepository celularRepository;
    private final CamaraRepository camaraRepository;
    private final TelevisorRepository televisorRepository;
    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;

    public StockUnidadesService(
            ComputadoraRepository computadoraRepository,
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            CamaraRepository camaraRepository,
            TelevisorRepository televisorRepository,
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository) {
        this.computadoraRepository = computadoraRepository;
        this.perifericoManualRepository = perifericoManualRepository;
        this.celularRepository = celularRepository;
        this.camaraRepository = camaraRepository;
        this.televisorRepository = televisorRepository;
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
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
        switch (coleccion) {
            case ColeccionesStock.COMPUTADORAS ->
                    computadoraRepository.mergeUpdates(id, MergeCodigoInterno.unSoloCampo(codigo));
            case ColeccionesStock.PERIFERICOS_MANUALES ->
                    perifericoManualRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.CELULARES -> celularRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.CAMARAS -> camaraRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.TELEVISORES -> televisorRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.ROUTERS -> routerRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.SWITCHES -> switchRedRepository.mergeCodigoInterno(id, codigo);
            case ColeccionesStock.ACCESS_POINTS -> accessPointRepository.mergeCodigoInterno(id, codigo);
            default -> throw new IllegalArgumentException("coleccion=" + coleccion + " id=" + id);
        }
    }

    private List<FichaLectura> leerFichas() {
        List<FichaLectura> fichas = new ArrayList<>();
        for (Computadora computadora : leer(ColeccionesStock.COMPUTADORAS, computadoraRepository::findAll)) {
            if (computadora != null) {
                fichas.add(ProyeccionStock.desdeComputadora(computadora));
            }
        }
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
        for (Camara camara : leer(ColeccionesStock.CAMARAS, camaraRepository::findAll)) {
            if (camara != null) {
                fichas.add(ProyeccionStock.desdeCamara(camara));
            }
        }
        for (Televisor televisor : leer(ColeccionesStock.TELEVISORES, televisorRepository::findAll)) {
            if (televisor != null) {
                fichas.add(ProyeccionStock.desdeTelevisor(televisor));
            }
        }
        for (Router router : leer(ColeccionesStock.ROUTERS, routerRepository::findAll)) {
            if (router != null) {
                fichas.add(ProyeccionStock.desdeRouter(router));
            }
        }
        for (SwitchRed sw : leer(ColeccionesStock.SWITCHES, switchRedRepository::findAll)) {
            if (sw != null) {
                fichas.add(ProyeccionStock.desdeSwitch(sw));
            }
        }
        for (AccessPoint ap : leer(ColeccionesStock.ACCESS_POINTS, accessPointRepository::findAll)) {
            if (ap != null) {
                fichas.add(ProyeccionStock.desdeAccessPoint(ap));
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
