package com.bacarsa.inventario.services;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AltaUnidadStockDTO;
import com.bacarsa.inventario.dto.BajaUnidadStockDTO;
import com.bacarsa.inventario.dto.ModificarUnidadStockDTO;
import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.EstadoCelular;
import com.bacarsa.inventario.models.TipoMovimiento;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class StockAbmService {

    private static final Logger log = LoggerFactory.getLogger(StockAbmService.class);

    private static final Pattern PATRON_CODIGO = Pattern.compile(
            "^(PC|NB|MON|TEC|MOU|IMP|WEB|PAR|MIC|CEL|CAM|TV|RTR|SW|AP|TEL|OTR)-(\\d+)$");

    private final StockUnidadesService stockUnidadesService;
    private final PerifericoManualRepository perifericoManualRepository;
    private final CelularRepository celularRepository;
    private final ComputadoraRepository computadoraRepository;
    private final AuditStockService auditService;

    public StockAbmService(
            StockUnidadesService stockUnidadesService,
            PerifericoManualRepository perifericoManualRepository,
            AuditStockService auditService) {
        this(stockUnidadesService, perifericoManualRepository, null, null, auditService);
    }

    @Autowired
    public StockAbmService(
            StockUnidadesService stockUnidadesService,
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            ComputadoraRepository computadoraRepository,
            AuditStockService auditService) {
        this.stockUnidadesService = stockUnidadesService;
        this.perifericoManualRepository = perifericoManualRepository;
        this.celularRepository = celularRepository;
        this.computadoraRepository = computadoraRepository;
        this.auditService = auditService;
    }

    public UnidadStockDTO alta(AltaUnidadStockDTO dto, String uid) throws Exception {
        if (dto == null) {
            throw new IllegalArgumentException("El cuerpo no puede ser nulo");
        }
        if (dto.getTipo() == null || dto.getTipo().isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }
        String prefijo = prefijoParaTipo(dto.getTipo());
        String codigo = siguienteCodigo(prefijo);
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();

        log.info("Stock ABM: alta coleccion={} codigo={} por actor={}", ColeccionesStock.PERIFERICOS_MANUALES, codigo, actorUid);

        String id = UUID.randomUUID().toString();
        Map<String, Object> campos = new HashMap<>();
        campos.put("codigo_interno", codigo);
        campos.put("tipo", dto.getTipo().trim().toLowerCase(Locale.ROOT));
        campos.put("cantidad", dto.getCantidad() != null && dto.getCantidad() > 0 ? dto.getCantidad() : 1);

        String marca = dto.getMarca() != null ? dto.getMarca().trim() : "";
        String modelo = dto.getModelo() != null && !dto.getModelo().isBlank()
                ? dto.getModelo().trim()
                : (dto.getHostname() != null ? dto.getHostname().trim() : "");
        String serie = dto.getSerieOImei() != null ? dto.getSerieOImei().trim() : "";

        campos.put("fabricante", marca);
        campos.put("nombre", modelo);
        if (!serie.isBlank()) {
            campos.put("numero_serie", serie);
        }
        if (dto.getCondicion() != null && !dto.getCondicion().isBlank()) {
            campos.put("condicion", dto.getCondicion().trim());
        }
        campos.put("ubicacion", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : "DEPOSITO");
        campos.put("fechaAlta", LocalDate.now().toString());
        campos.put("estadoActual", mapaEstado("SIN_ASIGNAR", "STOCK", "Alta en stock"));
        if (dto.getNotas() != null && !dto.getNotas().isBlank()) {
            campos.put("notas", dto.getNotas().trim());
        }
        if (dto.getComentarios() != null && !dto.getComentarios().isBlank()) {
            campos.put("comentarios", dto.getComentarios().trim());
        }

        perifericoManualRepository.actualizar(id, campos);

        auditService.registrar(AuditStockService.RegistroAudit.builder(TipoMovimiento.ALTA, id)
                .codigoInterno(codigo)
                .tipoEquipo(dto.getTipo().trim().toLowerCase(Locale.ROOT))
                .marca(marca)
                .modelo(modelo)
                .serieOImei(serie)
                .motivo("Alta en stock")
                .actorUid(actorUid)
                .estadoNuevo("Sin Asignar")
                .ubicacionDestino((String) campos.get("ubicacion"))
                .build());

        return stockUnidadesService.obtenerPorCodigo(codigo);
    }

    public UnidadStockDTO modificar(String codigo, ModificarUnidadStockDTO dto, String uid) throws Exception {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        if (dto == null) {
            throw new IllegalArgumentException("El cuerpo no puede ser nulo");
        }
        FichaLectura ficha = buscarFicha(codigo);
        String coleccion = ficha.getColeccion();
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();

        log.info("Stock ABM: modificar codigo={} coleccion={} id={} por actor={}", codigo, coleccion, id, actorUid);

        if (ColeccionesStock.COMPUTADORAS.equals(coleccion) && computadoraRepository != null) {
            Map<String, Object> updates = new HashMap<>();
            if (dto.getHostname() != null && !dto.getHostname().isBlank()) updates.put("hostname", dto.getHostname().trim());
            else if (dto.getModelo() != null && !dto.getModelo().isBlank()) updates.put("hostname", dto.getModelo().trim());
            if (dto.getSerieOImei() != null) updates.put("serialEquipo", dto.getSerieOImei().trim());
            if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
            if (dto.getCondicion() != null) updates.put("condicion", dto.getCondicion().trim());
            if (dto.getNotas() != null) updates.put("notas", dto.getNotas().trim());
            if (dto.getComentarios() != null) updates.put("comentarios", dto.getComentarios().trim());
            if (!updates.isEmpty()) {
                computadoraRepository.mergeUpdates(id, updates);
            }
        } else if (ColeccionesStock.CELULARES.equals(coleccion) && celularRepository != null) {
            Map<String, Object> updates = new HashMap<>();
            if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
            if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
            if (dto.getSerieOImei() != null) updates.put("imei", dto.getSerieOImei().trim());
            if (dto.getCondicion() != null) updates.put("condicion", dto.getCondicion().trim());
            if (dto.getUbicacion() != null) updates.put("area", dto.getUbicacion().trim());
            if (!updates.isEmpty()) {
                celularRepository.actualizar(id, updates);
            }
        } else {
            Map<String, Object> updates = new HashMap<>();
            if (dto.getMarca() != null) updates.put("fabricante", dto.getMarca().trim());
            if (dto.getModelo() != null) updates.put("nombre", dto.getModelo().trim());
            else if (dto.getHostname() != null) updates.put("nombre", dto.getHostname().trim());
            if (dto.getSerieOImei() != null) updates.put("numero_serie", dto.getSerieOImei().trim());
            if (dto.getCondicion() != null) updates.put("condicion", dto.getCondicion().trim());
            if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
            if (dto.getNotas() != null) updates.put("notas", dto.getNotas().trim());
            if (dto.getComentarios() != null) updates.put("comentarios", dto.getComentarios().trim());
            if (dto.getCantidad() != null && dto.getCantidad() > 0) updates.put("cantidad", dto.getCantidad());

            if (!updates.isEmpty()) {
                perifericoManualRepository.actualizar(id, updates);
            }
        }

        return stockUnidadesService.obtenerPorCodigo(codigo);
    }

    public UnidadStockDTO darDeBaja(String codigo, BajaUnidadStockDTO dto, String uid) throws Exception {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        if (dto == null || dto.getMotivo() == null || dto.getMotivo().isBlank()) {
            throw new IllegalArgumentException("El motivo de la baja es obligatorio");
        }
        FichaLectura ficha = buscarFicha(codigo);
        String coleccion = ficha.getColeccion();
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String motivo = dto.getMotivo().trim();

        log.info("Stock ABM: baja codigo={} coleccion={} id={} motivo={} por actor={}",
                codigo, coleccion, id, motivo, actorUid);

        Map<String, Object> updates = new HashMap<>();
        updates.put("motivo_baja", motivo);
        updates.put("fecha_baja", LocalDate.now().toString());
        updates.put("usuario_baja", actorUid);

        if (ColeccionesStock.COMPUTADORAS.equals(coleccion) && computadoraRepository != null) {
            updates.put("estadoActual", mapaEstado("BAJA", "COMPUTADORA", motivo));
            computadoraRepository.mergeUpdates(id, updates);
        } else if (ColeccionesStock.CELULARES.equals(coleccion) && celularRepository != null) {
            updates.put("estado", EstadoCelular.baja.name());
            celularRepository.actualizar(id, updates);
        } else {
            updates.put("estadoActual", mapaEstado("BAJA", "STOCK", motivo));
            perifericoManualRepository.actualizar(id, updates);
        }

        String codigoAudit = (ficha.getCodigoInterno() != null && !ficha.getCodigoInterno().isBlank())
                ? ficha.getCodigoInterno()
                : id;

        auditService.registrar(AuditStockService.RegistroAudit.builder(TipoMovimiento.BAJA, id)
                .codigoInterno(codigoAudit)
                .tipoEquipo(ficha.getTipo())
                .marca(ficha.getMarca())
                .modelo(ficha.getModelo())
                .serieOImei(ficha.getSerieOImei())
                .motivo(motivo)
                .actorUid(actorUid)
                .estadoAnterior(ficha.getEstadoDeposito())
                .estadoNuevo("Baja")
                .build());

        return stockUnidadesService.obtenerPorCodigo(codigo);
    }

    public String siguienteCodigo(String prefijo) {
        int max = 0;
        for (FichaLectura ficha : stockUnidadesService.leerFichas()) {
            String cod = ficha.getCodigoInterno();
            if (cod != null && !cod.isBlank()) {
                Matcher matcher = PATRON_CODIGO.matcher(cod.trim());
                if (matcher.matches() && matcher.group(1).equals(prefijo)) {
                    try {
                        int num = Integer.parseInt(matcher.group(2));
                        if (num > max) {
                            max = num;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        return prefijo + "-" + (max + 1);
    }

    public static String prefijoParaTipo(String tipoRaw) {
        if (tipoRaw == null || tipoRaw.isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }
        String tipo = tipoRaw.trim().toLowerCase(Locale.ROOT);
        return switch (tipo) {
            case "desktop", "computadora", "pc" -> "PC";
            case "notebook", "laptop" -> "NB";
            case "monitor" -> "MON";
            case "teclado" -> "TEC";
            case "mouse" -> "MOU";
            case "impresora" -> "IMP";
            case "webcam" -> "WEB";
            case "parlante" -> "PAR";
            case "microfono", "micrófono" -> "MIC";
            case "celular" -> "CEL";
            case "camara", "cámara", "camara_ip", "cámara_ip" -> "CAM";
            case "televisor" -> "TV";
            case "router" -> "RTR";
            case "switch" -> "SW";
            case "access_point", "accesspoint", "ap" -> "AP";
            case "telefono_ip", "telefono" -> "TEL";
            case "otro" -> "OTR";
            // Tipos del catálogo aún no mapeados (p.ej. tablet): no bloquear el alta.
            default -> "OTR";
        };
    }

    public static String coleccionParaPrefijo(String prefijo) {
        return ColeccionesStock.PERIFERICOS_MANUALES;
    }

    private FichaLectura buscarFicha(String codigo) {
        String codigoLimpio = codigo.trim();
        for (FichaLectura ficha : stockUnidadesService.leerFichas()) {
            if (codigoLimpio.equalsIgnoreCase(ficha.getCodigoInterno())
                    || codigoLimpio.equalsIgnoreCase(ficha.getId())) {
                return ficha;
            }
        }
        throw new IllegalArgumentException("Unidad de stock no encontrada con código: " + codigo);
    }

    private static Map<String, Object> mapaEstado(String nombre, String ambito, String descripcion) {
        Map<String, Object> mapa = new HashMap<>();
        mapa.put("nombre", nombre);
        if (ambito != null) mapa.put("ambito", ambito);
        if (descripcion != null) mapa.put("descripcion", descripcion);
        return mapa;
    }
}
