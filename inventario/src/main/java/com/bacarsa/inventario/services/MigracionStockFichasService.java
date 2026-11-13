package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MigracionStockFichasResultDTO;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;
import com.google.cloud.Timestamp;

@Service
public class MigracionStockFichasService {

    private static final Logger log = LoggerFactory.getLogger(MigracionStockFichasService.class);

    private final StockUnidadesService stockUnidadesService;
    private final StockFichaRepository stockFichaRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    public MigracionStockFichasService(
            StockUnidadesService stockUnidadesService,
            StockFichaRepository stockFichaRepository,
            MovimientoStockRepository movimientoStockRepository) {
        this.stockUnidadesService = stockUnidadesService;
        this.stockFichaRepository = stockFichaRepository;
        this.movimientoStockRepository = movimientoStockRepository;
    }

    public MigracionStockFichasResultDTO migrar(boolean sobrescribir) throws ExecutionException, InterruptedException {
        log.info("Iniciando migración a stock_fichas (sobrescribir={})...", sobrescribir);
        List<String> errores = new ArrayList<>();
        int fichasCreadas = 0;
        int fichasOmitidas = 0;
        int movimientosVinculados = 0;

        List<FichaLectura> fichasLectura = stockUnidadesService.leerFichas();
        Set<String> codigosProcesados = new HashSet<>();

        for (FichaLectura ficha : fichasLectura) {
            String codigo = ficha.getCodigoInterno();
            if (codigo == null || codigo.isBlank()) {
                codigo = ficha.getId();
            }
            if (codigo == null || codigo.isBlank()) {
                fichasOmitidas++;
                continue;
            }
            codigo = codigo.trim();

            if (codigosProcesados.contains(codigo)) {
                log.warn("Código duplicado en proyección de stock: {}, omitiendo ocurrencia secundaria", codigo);
                fichasOmitidas++;
                continue;
            }

            try {
                StockFicha existente = stockFichaRepository.findById(codigo);
                if (existente != null && !sobrescribir) {
                    codigosProcesados.add(codigo);
                    fichasOmitidas++;
                    continue;
                }

                StockFicha nueva = construirFicha(codigo, ficha);
                stockFichaRepository.save(nueva);
                codigosProcesados.add(codigo);
                fichasCreadas++;
            } catch (Exception ex) {
                String err = "Error al migrar ficha codigo=" + codigo + ": " + ex.getMessage();
                log.error(err, ex);
                errores.add(err);
            }
        }

        // Paso 2: Vincular movimientos existentes con ficha_codigo
        try {
            List<MovimientoStock> movimientos = movimientoStockRepository.findAll();
            for (MovimientoStock mov : movimientos) {
                if (mov.getId() == null || mov.getId().isBlank()) {
                    continue;
                }
                String fichaCodigo = mov.getFichaCodigo();
                if (fichaCodigo != null && !fichaCodigo.isBlank()) {
                    continue; // ya vinculado
                }
                String codigoMov = mov.getCodigo();
                if (codigoMov != null && !codigoMov.isBlank()) {
                    String normalizado = codigoMov.trim();
                    movimientoStockRepository.update(mov.getId(), Map.of("ficha_codigo", normalizado));
                    movimientosVinculados++;
                }
            }
        } catch (Exception ex) {
            String err = "Error al actualizar movimientos_stock con ficha_codigo: " + ex.getMessage();
            log.error(err, ex);
            errores.add(err);
        }

        String mensaje = String.format("Migración completada. Fichas creadas: %d, Fichas omitidas: %d, Movimientos vinculados: %d. Errores: %d",
                fichasCreadas, fichasOmitidas, movimientosVinculados, errores.size());
        log.info(mensaje);

        return MigracionStockFichasResultDTO.builder()
                .fichasCreadas(fichasCreadas)
                .fichasOmitidas(fichasOmitidas)
                .movimientosVinculados(movimientosVinculados)
                .errores(errores)
                .mensaje(mensaje)
                .build();
    }

    private StockFicha construirFicha(String codigo, FichaLectura ficha) {
        String tipo = normalizarTipo(ficha.getTipo());
        String estado = normalizarEstado(ficha.getEstadoDeposito(), ficha.getMotivoOmitir());
        String condicion = normalizarCondicion(ficha.getCondicion());

        String descripcion = ficha.getDescripcionCompleta();
        if (descripcion == null || descripcion.isBlank()) {
            String marcaModelo = ((ficha.getMarca() != null ? ficha.getMarca() : "") + " " +
                                  (ficha.getModelo() != null ? ficha.getModelo() : "")).trim();
            descripcion = !marcaModelo.isBlank() ? marcaModelo : tipo;
        }

        String ubicacion = ficha.getUbicacion();
        if ((ubicacion == null || ubicacion.isBlank()) && "EN_DEPOSITO".equals(estado)) {
            ubicacion = "Depósito Sistemas";
        }

        String refOrigen = ficha.getColeccion() != null && ficha.getId() != null
                ? ficha.getColeccion() + "/" + ficha.getId()
                : null;

        Timestamp now = Timestamp.now();

        return StockFicha.builder()
                .codigoInterno(codigo)
                .tipo(tipo)
                .descripcion(descripcion)
                .marca(ficha.getMarca() != null ? ficha.getMarca() : "")
                .modelo(ficha.getModelo() != null ? ficha.getModelo() : "")
                .serieOImei(ficha.getSerieOImei() != null ? ficha.getSerieOImei() : "")
                .estado(estado)
                .responsableId(null)
                .responsableNombre(null)
                .area(null)
                .ubicacion(ubicacion != null ? ubicacion : "")
                .condicion(condicion)
                .refOrigen(refOrigen)
                .cantidad(ficha.getCantidad() != null && ficha.getCantidad() > 0 ? ficha.getCantidad() : 1)
                .createdAt(now)
                .updatedAt(now)
                .notas(ficha.getComentarios() != null ? ficha.getComentarios() : "")
                .build();
    }

    private String normalizarTipo(String tipoRaw) {
        if (tipoRaw == null || tipoRaw.isBlank()) {
            return "PERIFERICO";
        }
        String t = tipoRaw.trim().toUpperCase(Locale.ROOT);
        return switch (t) {
            case "NOTEBOOK", "LAPTOP" -> "NOTEBOOK";
            case "DESKTOP", "PC", "COMPUTADORA" -> "DESKTOP";
            case "MONITOR" -> "MONITOR";
            case "TECLADO" -> "TECLADO";
            case "MOUSE" -> "MOUSE";
            case "IMPRESORA" -> "IMPRESORA";
            case "WEBCAM" -> "WEBCAM";
            case "PARLANTE" -> "PARLANTE";
            case "MICROFONO", "MICRÓFONO" -> "MICROFONO";
            case "CELULAR" -> "CELULAR";
            case "CAMARA", "CÁMARA", "CAMARA_IP", "CÁMARA_IP" -> "CAMARA";
            case "TELEVISOR", "TV" -> "TV";
            case "ROUTER" -> "ROUTER";
            case "SWITCH" -> "SWITCH";
            case "ACCESS_POINT", "ACCESSPOINT", "AP" -> "AP";
            case "TELEFONO_IP", "TELEFONO" -> "TELEFONO_IP";
            default -> t;
        };
    }

    private String normalizarEstado(String estadoRaw, String motivoOmitir) {
        if (motivoOmitir != null && !motivoOmitir.isBlank()) {
            String m = motivoOmitir.trim().toLowerCase(Locale.ROOT);
            if (m.contains("asignad") || m.contains("operativo")) {
                return "ASIGNADA";
            }
        }
        if (estadoRaw == null || estadoRaw.isBlank()) {
            return "EN_DEPOSITO";
        }
        String e = estadoRaw.trim().toUpperCase(Locale.ROOT);
        if (e.contains("BAJA") || e.contains("ROTO") || e.contains("SCRAP")) {
            return "BAJA";
        }
        if (e.contains("REPARACION") || e.contains("MANTENIMIENTO") || e.contains("SERVICIO")) {
            return "EN_MANTENIMIENTO";
        }
        if (e.contains("ASIGNAD") || e.contains("OPERATIV") || e.contains("EN_USO") || e.contains("EN USO") || e.contains("ACTIVA")) {
            return "ASIGNADA";
        }
        return "EN_DEPOSITO";
    }

    private String normalizarCondicion(String condicionRaw) {
        if (condicionRaw == null || condicionRaw.isBlank()) {
            return "USADA";
        }
        String c = condicionRaw.trim().toUpperCase(Locale.ROOT);
        if (c.contains("NUEV")) {
            return "NUEVA";
        }
        if (c.contains("REPAR") || c.contains("RECUPER")) {
            return "REPARADA";
        }
        return "USADA";
    }
}
