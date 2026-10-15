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
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AltaUnidadStockDTO;
import com.bacarsa.inventario.dto.BajaUnidadStockDTO;
import com.bacarsa.inventario.dto.ModificarUnidadStockDTO;
import com.bacarsa.inventario.dto.UnidadStockDTO;
import com.bacarsa.inventario.models.EstadoCelular;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@Service
public class StockAbmService {

    private static final Logger log = LoggerFactory.getLogger(StockAbmService.class);

    private static final Pattern PATRON_CODIGO = Pattern.compile(
            "^(PC|NB|MON|TEC|MOU|IMP|WEB|PAR|MIC|CEL|CAM|TV|RTR|SW|AP)-(\\d+)$");

    private final StockUnidadesService stockUnidadesService;
    private final ComputadoraHistorialService computadoraHistorialService;
    private final PerifericoManualRepository perifericoManualRepository;
    private final CelularRepository celularRepository;
    private final CamaraRepository camaraRepository;
    private final TelevisorRepository televisorRepository;
    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;

    public StockAbmService(
            StockUnidadesService stockUnidadesService,
            ComputadoraHistorialService computadoraHistorialService,
            PerifericoManualRepository perifericoManualRepository,
            CelularRepository celularRepository,
            CamaraRepository camaraRepository,
            TelevisorRepository televisorRepository,
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository) {
        this.stockUnidadesService = stockUnidadesService;
        this.computadoraHistorialService = computadoraHistorialService;
        this.perifericoManualRepository = perifericoManualRepository;
        this.celularRepository = celularRepository;
        this.camaraRepository = camaraRepository;
        this.televisorRepository = televisorRepository;
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
    }

    public UnidadStockDTO alta(AltaUnidadStockDTO dto, String uid) throws Exception {
        if (dto == null) {
            throw new IllegalArgumentException("El cuerpo no puede ser nulo");
        }
        if (dto.getTipo() == null || dto.getTipo().isBlank()) {
            throw new IllegalArgumentException("El tipo es obligatorio");
        }
        String prefijo = prefijoParaTipo(dto.getTipo());
        String coleccion = coleccionParaPrefijo(prefijo);
        String codigo = siguienteCodigo(prefijo);
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();

        log.info("Stock ABM: alta coleccion={} codigo={} por actor={}", coleccion, codigo, actorUid);

        switch (coleccion) {
            case ColeccionesStock.COMPUTADORAS -> {
                String uuid = UUID.randomUUID().toString();
                Map<String, Object> cuerpo = new HashMap<>();
                cuerpo.put("hostname", dto.getHostname() != null && !dto.getHostname().isBlank()
                        ? dto.getHostname().trim()
                        : codigo.toLowerCase());
                cuerpo.put("tipoEquipo", dto.getTipo().trim());
                cuerpo.put("codigo_interno", codigo);
                if (dto.getUbicacion() != null) cuerpo.put("ubicacion", dto.getUbicacion().trim());
                if (dto.getCondicion() != null) cuerpo.put("condicion", dto.getCondicion().trim());
                if (dto.getSerieOImei() != null) cuerpo.put("serialEquipo", dto.getSerieOImei().trim());
                if (dto.getNotas() != null) cuerpo.put("notas", dto.getNotas().trim());

                String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                        ? dto.getMotivo().trim()
                        : "Alta en stock";
                computadoraHistorialService.altaManual(uuid, cuerpo, motivo, actorUid);
            }
            case ColeccionesStock.PERIFERICOS_MANUALES -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("tipo", dto.getTipo().trim().toLowerCase(Locale.ROOT));
                campos.put("cantidad", 1);
                if (dto.getMarca() != null) campos.put("fabricante", dto.getMarca().trim());
                if (dto.getSerieOImei() != null) campos.put("numero_serie", dto.getSerieOImei().trim());
                campos.put("ubicacion", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : "DEPOSITO");
                campos.put("fechaAlta", LocalDate.now().toString());
                campos.put("estadoActual", mapaEstado("SIN_ASIGNAR", "PERIFERICO", "Alta en stock"));
                if (dto.getNotas() != null) campos.put("notas", dto.getNotas().trim());
                perifericoManualRepository.actualizar(id, campos);
            }
            case ColeccionesStock.CELULARES -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("modelo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("imei", dto.getSerieOImei() != null ? dto.getSerieOImei().trim() : "");
                campos.put("condicion", dto.getCondicion() != null ? dto.getCondicion().trim() : "usado");
                campos.put("con_cargador", Boolean.FALSE);
                campos.put("area", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : "Depósito");
                campos.put("estado", EstadoCelular.en_stock.name());
                celularRepository.actualizar(id, campos);
            }
            case ColeccionesStock.CAMARAS -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("tipo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("ubicacion", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : "DEPOSITO");
                campos.put("fechaAlta", LocalDate.now().toString());
                campos.put("estadoActual", mapaEstado("SIN_ASIGNAR", "CAMARA", "Alta en stock"));
                camaraRepository.actualizar(id, campos);
            }
            case ColeccionesStock.TELEVISORES -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("modelo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("numero_serie", dto.getSerieOImei() != null ? dto.getSerieOImei().trim() : "");
                campos.put("area", dto.getUbicacion() != null && !dto.getUbicacion().isBlank() ? dto.getUbicacion().trim() : "DEPOSITO");
                campos.put("estado", "en_stock");
                televisorRepository.actualizar(id, campos);
            }
            case ColeccionesStock.ROUTERS -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("modelo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("numero_serie", dto.getSerieOImei() != null ? dto.getSerieOImei().trim() : "");
                campos.put("fecha_alta", LocalDate.now().toString());
                campos.put("ubicacion", parseUbicacionRed(dto.getUbicacion()));
                campos.put("estado", "en_stock");
                routerRepository.actualizar(id, campos);
            }
            case ColeccionesStock.SWITCHES -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("modelo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("numero_serie", dto.getSerieOImei() != null ? dto.getSerieOImei().trim() : "");
                campos.put("fecha_alta", LocalDate.now().toString());
                campos.put("ubicacion", parseUbicacionRed(dto.getUbicacion()));
                campos.put("estado", "en_stock");
                switchRedRepository.actualizar(id, campos);
            }
            case ColeccionesStock.ACCESS_POINTS -> {
                String id = UUID.randomUUID().toString();
                Map<String, Object> campos = new HashMap<>();
                campos.put("codigo_interno", codigo);
                campos.put("marca", dto.getMarca() != null ? dto.getMarca().trim() : "");
                campos.put("modelo", dto.getModelo() != null ? dto.getModelo().trim() : "");
                campos.put("ubicacion", parseUbicacionRed(dto.getUbicacion()));
                campos.put("estado", "en_stock");
                accessPointRepository.actualizar(id, campos);
            }
            default -> throw new IllegalArgumentException("Colección no soportada: " + coleccion);
        }

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

        if (ColeccionesStock.COMPUTADORAS.equals(coleccion)) {
            Map<String, Object> cuerpo = new HashMap<>();
            if (dto.getHostname() != null && !dto.getHostname().isBlank()) cuerpo.put("hostname", dto.getHostname().trim());
            if (dto.getSerieOImei() != null) cuerpo.put("serialEquipo", dto.getSerieOImei().trim());
            if (dto.getUbicacion() != null) cuerpo.put("ubicacion", dto.getUbicacion().trim());
            if (dto.getCondicion() != null) cuerpo.put("condicion", dto.getCondicion().trim());
            if (dto.getNotas() != null) cuerpo.put("notas", dto.getNotas().trim());

            if (!cuerpo.isEmpty()) {
                computadoraHistorialService.editarFicha(id, cuerpo, actorUid);
            }
        } else {
            Map<String, Object> updates = new HashMap<>();
            switch (coleccion) {
                case ColeccionesStock.PERIFERICOS_MANUALES -> {
                    if (dto.getMarca() != null) updates.put("fabricante", dto.getMarca().trim());
                    if (dto.getSerieOImei() != null) updates.put("numero_serie", dto.getSerieOImei().trim());
                    if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
                    if (dto.getNotas() != null) updates.put("notas", dto.getNotas().trim());
                    if (!updates.isEmpty()) perifericoManualRepository.actualizar(id, updates);
                }
                case ColeccionesStock.CELULARES -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
                    if (dto.getSerieOImei() != null) updates.put("imei", dto.getSerieOImei().trim());
                    if (dto.getCondicion() != null) updates.put("condicion", dto.getCondicion().trim());
                    if (dto.getUbicacion() != null) updates.put("area", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) celularRepository.actualizar(id, updates);
                }
                case ColeccionesStock.CAMARAS -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("tipo", dto.getModelo().trim());
                    if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) camaraRepository.actualizar(id, updates);
                }
                case ColeccionesStock.TELEVISORES -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
                    if (dto.getSerieOImei() != null) updates.put("numero_serie", dto.getSerieOImei().trim());
                    if (dto.getUbicacion() != null) updates.put("area", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) televisorRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ROUTERS -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
                    if (dto.getSerieOImei() != null) updates.put("numero_serie", dto.getSerieOImei().trim());
                    if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) routerRepository.actualizar(id, updates);
                }
                case ColeccionesStock.SWITCHES -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
                    if (dto.getSerieOImei() != null) updates.put("numero_serie", dto.getSerieOImei().trim());
                    if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) switchRedRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ACCESS_POINTS -> {
                    if (dto.getMarca() != null) updates.put("marca", dto.getMarca().trim());
                    if (dto.getModelo() != null) updates.put("modelo", dto.getModelo().trim());
                    if (dto.getUbicacion() != null) updates.put("ubicacion", dto.getUbicacion().trim());
                    if (!updates.isEmpty()) accessPointRepository.actualizar(id, updates);
                }
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

        if (ColeccionesStock.COMPUTADORAS.equals(coleccion)) {
            computadoraHistorialService.cambiarEstado(id, EstadoOperativo.BAJA.name(), motivo, Map.of(), actorUid);
        } else {
            Map<String, Object> updates = new HashMap<>();
            updates.put("motivo_baja", motivo);
            updates.put("fecha_baja", LocalDate.now().toString());
            updates.put("usuario_baja", actorUid);

            switch (coleccion) {
                case ColeccionesStock.PERIFERICOS_MANUALES -> {
                    updates.put("estadoActual", mapaEstado("BAJA", "PERIFERICO", motivo));
                    perifericoManualRepository.actualizar(id, updates);
                }
                case ColeccionesStock.CELULARES -> {
                    updates.put("estado", EstadoCelular.baja.name());
                    celularRepository.actualizar(id, updates);
                }
                case ColeccionesStock.CAMARAS -> {
                    updates.put("estadoActual", mapaEstado("BAJA", "CAMARA", motivo));
                    camaraRepository.actualizar(id, updates);
                }
                case ColeccionesStock.TELEVISORES -> {
                    updates.put("estado", "BAJA");
                    televisorRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ROUTERS -> {
                    updates.put("estado", "BAJA");
                    updates.put("estadoActual", mapaEstado("BAJA", "ROUTER", motivo));
                    routerRepository.actualizar(id, updates);
                }
                case ColeccionesStock.SWITCHES -> {
                    updates.put("estado", "BAJA");
                    updates.put("estadoActual", mapaEstado("BAJA", "SWITCH", motivo));
                    switchRedRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ACCESS_POINTS -> {
                    updates.put("estado", "BAJA");
                    accessPointRepository.actualizar(id, updates);
                }
            }
        }

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
            case "desktop" -> "PC";
            case "notebook" -> "NB";
            case "monitor" -> "MON";
            case "teclado" -> "TEC";
            case "mouse" -> "MOU";
            case "impresora" -> "IMP";
            case "webcam" -> "WEB";
            case "parlante" -> "PAR";
            case "microfono", "micrófono" -> "MIC";
            case "celular" -> "CEL";
            case "camara", "cámara" -> "CAM";
            case "televisor" -> "TV";
            case "router" -> "RTR";
            case "switch" -> "SW";
            case "access_point", "accesspoint", "ap" -> "AP";
            default -> throw new IllegalArgumentException("Tipo desconocido para stock: " + tipoRaw);
        };
    }

    public static String coleccionParaPrefijo(String prefijo) {
        return switch (prefijo) {
            case "PC", "NB" -> ColeccionesStock.COMPUTADORAS;
            case "MON", "TEC", "MOU", "IMP", "WEB", "PAR", "MIC" -> ColeccionesStock.PERIFERICOS_MANUALES;
            case "CEL" -> ColeccionesStock.CELULARES;
            case "CAM" -> ColeccionesStock.CAMARAS;
            case "TV" -> ColeccionesStock.TELEVISORES;
            case "RTR" -> ColeccionesStock.ROUTERS;
            case "SW" -> ColeccionesStock.SWITCHES;
            case "AP" -> ColeccionesStock.ACCESS_POINTS;
            default -> throw new IllegalArgumentException("Prefijo desconocido: " + prefijo);
        };
    }

    private FichaLectura buscarFicha(String codigo) {
        String codigoLimpio = codigo.trim();
        for (FichaLectura ficha : stockUnidadesService.leerFichas()) {
            if (codigoLimpio.equalsIgnoreCase(ficha.getCodigoInterno())) {
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

    private static String parseUbicacionRed(String raw) {
        if (raw == null || raw.isBlank()) {
            return UbicacionRed.SISTEMAS.name();
        }
        for (UbicacionRed u : UbicacionRed.values()) {
            if (u.name().equalsIgnoreCase(raw.trim())) {
                return u.name();
            }
        }
        return UbicacionRed.SISTEMAS.name();
    }
}
