package com.bacarsa.inventario.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AsignarUnidadStockDTO;
import com.bacarsa.inventario.dto.DevolverUnidadStockDTO;
import com.bacarsa.inventario.dto.MovimientoStockDTO;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EstadoCelular;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;
import com.bacarsa.inventario.repository.TelevisorRepository;

@Service
public class StockAsignacionesService {

    private static final Logger log = LoggerFactory.getLogger(StockAsignacionesService.class);
    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MovimientoStockRepository movimientoStockRepository;
    private final StockUnidadesService stockUnidadesService;
    private final ComputadoraHistorialService computadoraHistorialService;
    private final ComputadoraRepository computadoraRepository;
    private final CelularRepository celularRepository;
    private final PerifericoManualRepository perifericoManualRepository;
    private final CamaraRepository camaraRepository;
    private final TelevisorRepository televisorRepository;
    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;

    public StockAsignacionesService(
            MovimientoStockRepository movimientoStockRepository,
            StockUnidadesService stockUnidadesService,
            ComputadoraHistorialService computadoraHistorialService,
            ComputadoraRepository computadoraRepository,
            CelularRepository celularRepository,
            PerifericoManualRepository perifericoManualRepository,
            CamaraRepository camaraRepository,
            TelevisorRepository televisorRepository,
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository) {
        this.movimientoStockRepository = movimientoStockRepository;
        this.stockUnidadesService = stockUnidadesService;
        this.computadoraHistorialService = computadoraHistorialService;
        this.computadoraRepository = computadoraRepository;
        this.celularRepository = celularRepository;
        this.perifericoManualRepository = perifericoManualRepository;
        this.camaraRepository = camaraRepository;
        this.televisorRepository = televisorRepository;
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
    }

    public MovimientoStockDTO asignar(String codigo, AsignarUnidadStockDTO dto, String uid) throws Exception {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        if (dto == null || dto.getResponsable() == null || dto.getResponsable().isBlank()) {
            throw new IllegalArgumentException("El nombre del responsable es obligatorio");
        }

        FichaLectura ficha = buscarFicha(codigo);
        String coleccion = ficha.getColeccion();
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String responsable = dto.getResponsable().trim();
        String area = dto.getArea() != null ? dto.getArea().trim() : "";
        String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Asignación de stock a " + responsable;

        String accion = "celular".equalsIgnoreCase(ficha.getTipo()) ? "Liberación de stock" : "Asignación";

        log.info("Stock Asignaciones: asignando codigo={} coleccion={} id={} a responsable='{}' por actor={}",
                codigo, coleccion, id, responsable, actorUid);

        // 1. El movimiento se escribe primero en Firestore con estado "Pendiente"
        String movimientoId = UUID.randomUUID().toString();
        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setId(movimientoId);
        movimiento.setCodigo(ficha.getCodigoInterno());
        movimiento.setTipo(normalizarTipoLabel(ficha.getTipo()));
        movimiento.setMarca(ficha.getMarca());
        movimiento.setModelo(ficha.getModelo());
        movimiento.setSerieOImei(ficha.getSerieOImei());
        movimiento.setResponsable(responsable);
        movimiento.setArea(area);
        movimiento.setAccion(accion);
        movimiento.setEstado("Pendiente");
        movimiento.setFecha(ahora);
        movimiento.setMotivo(motivo);
        movimiento.setActorUid(actorUid);

        movimientoStockRepository.save(movimiento);

        // 2. Se actualiza la ficha de la unidad según la colección
        try {
            switch (coleccion) {
                case ColeccionesStock.COMPUTADORAS -> {
                    Map<String, Object> fichaUpdates = new HashMap<>();
                    fichaUpdates.put("responsable", responsable);
                    if (!area.isBlank()) {
                        fichaUpdates.put("ubicacion", area);
                    }
                    computadoraHistorialService.cambiarEstado(
                            id,
                            EstadoOperativo.ASIGNADA.name(),
                            motivo,
                            fichaUpdates,
                            actorUid);
                }
                case ColeccionesStock.CELULARES -> {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("responsable", responsable);
                    if (!area.isBlank()) {
                        updates.put("area", area);
                    }
                    updates.put("estado", EstadoCelular.activo.name());
                    celularRepository.actualizar(id, updates);
                }
                case ColeccionesStock.PERIFERICOS_MANUALES -> {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("responsable", responsable);
                    if (!area.isBlank()) {
                        updates.put("ubicacion", area);
                    }
                    updates.put("estadoActual", mapaEstado("ASIGNADA", "PERIFERICO", motivo));
                    perifericoManualRepository.actualizar(id, updates);
                }
                case ColeccionesStock.CAMARAS -> {
                    Map<String, Object> updates = new HashMap<>();
                    if (!area.isBlank()) {
                        updates.put("ubicacion", area);
                    }
                    updates.put("estadoActual", mapaEstado("ASIGNADA", "CAMARA", motivo));
                    camaraRepository.actualizar(id, updates);
                }
                case ColeccionesStock.TELEVISORES -> {
                    Map<String, Object> updates = new HashMap<>();
                    if (!area.isBlank()) {
                        updates.put("area", area);
                    }
                    updates.put("estado", "ASIGNADA");
                    televisorRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ROUTERS -> {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("estado", "ASIGNADA");
                    updates.put("estadoActual", mapaEstado("ASIGNADA", "ROUTER", motivo));
                    routerRepository.actualizar(id, updates);
                }
                case ColeccionesStock.SWITCHES -> {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("estado", "ASIGNADA");
                    updates.put("estadoActual", mapaEstado("ASIGNADA", "SWITCH", motivo));
                    switchRedRepository.actualizar(id, updates);
                }
                case ColeccionesStock.ACCESS_POINTS -> {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("estado", "ASIGNADA");
                    accessPointRepository.actualizar(id, updates);
                }
                default -> throw new IllegalArgumentException("Colección no soportada: " + coleccion);
            }

            // 3. Al confirmarse la actualización de la ficha, el movimiento pasa a "Activa"
            movimientoStockRepository.update(movimientoId, Map.of("estado", "Activa"));
            movimiento.setEstado("Activa");
        } catch (Exception ex) {
            log.error("Stock Asignaciones: fallo al actualizar la ficha {} para codigo={}. El movimiento permanece Pendiente.",
                    id, codigo, ex);
            throw ex;
        }

        return toDTO(movimiento);
    }

    public MovimientoStockDTO devolver(String codigo, DevolverUnidadStockDTO dto, String uid) throws Exception {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }

        FichaLectura ficha = buscarFicha(codigo);
        String coleccion = ficha.getColeccion();
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String motivo = dto != null && dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Devolución a Disponible";

        log.info("Stock Asignaciones: devolviendo codigo={} coleccion={} id={} por actor={}",
                codigo, coleccion, id, actorUid);

        // 1. Actualizar la ficha de la unidad según su tipo para que vuelva a Disponible
        switch (coleccion) {
            case ColeccionesStock.COMPUTADORAS -> {
                Map<String, Object> fichaUpdates = new HashMap<>();
                fichaUpdates.put("responsable", null);
                computadoraHistorialService.cambiarEstado(
                        id,
                        EstadoOperativo.SIN_ASIGNAR.name(),
                        motivo,
                        fichaUpdates,
                        actorUid);
            }
            case ColeccionesStock.CELULARES -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("responsable", null);
                updates.put("area", "Depósito");
                updates.put("estado", EstadoCelular.en_stock.name());
                celularRepository.actualizar(id, updates);
            }
            case ColeccionesStock.PERIFERICOS_MANUALES -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("responsable", null);
                updates.put("ubicacion", "DEPOSITO");
                updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "PERIFERICO", motivo));
                perifericoManualRepository.actualizar(id, updates);
            }
            case ColeccionesStock.CAMARAS -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("ubicacion", "DEPOSITO");
                updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "CAMARA", motivo));
                camaraRepository.actualizar(id, updates);
            }
            case ColeccionesStock.TELEVISORES -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("area", "DEPOSITO");
                updates.put("estado", "en_stock");
                televisorRepository.actualizar(id, updates);
            }
            case ColeccionesStock.ROUTERS -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("estado", "en_stock");
                updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "ROUTER", motivo));
                routerRepository.actualizar(id, updates);
            }
            case ColeccionesStock.SWITCHES -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("estado", "en_stock");
                updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "SWITCH", motivo));
                switchRedRepository.actualizar(id, updates);
            }
            case ColeccionesStock.ACCESS_POINTS -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("estado", "en_stock");
                accessPointRepository.actualizar(id, updates);
            }
            default -> throw new IllegalArgumentException("Colección no soportada: " + coleccion);
        }

        // 2. Cerrar movimiento(s) activo(s) en movimientos_stock
        String ultimoResponsable = "";
        String ultimaArea = "";
        List<MovimientoStock> todosMovs = movimientoStockRepository.findAll();
        for (MovimientoStock m : todosMovs) {
            if (codigo.trim().equalsIgnoreCase(m.getCodigo())
                    && ("Activa".equalsIgnoreCase(m.getEstado()) || "Pendiente".equalsIgnoreCase(m.getEstado()))) {
                if (ultimoResponsable.isBlank() && m.getResponsable() != null) {
                    ultimoResponsable = m.getResponsable();
                }
                if (ultimaArea.isBlank() && m.getArea() != null) {
                    ultimaArea = m.getArea();
                }
                movimientoStockRepository.update(m.getId(), Map.of(
                        "estado", "Finalizada",
                        "fecha_devolucion", ahora));
            }
        }

        // 3. Asentar el registro de Devolución en estado Finalizada
        String devId = UUID.randomUUID().toString();
        MovimientoStock devMov = new MovimientoStock();
        devMov.setId(devId);
        devMov.setCodigo(ficha.getCodigoInterno());
        devMov.setTipo(normalizarTipoLabel(ficha.getTipo()));
        devMov.setMarca(ficha.getMarca());
        devMov.setModelo(ficha.getModelo());
        devMov.setSerieOImei(ficha.getSerieOImei());
        devMov.setResponsable(!ultimoResponsable.isBlank() ? ultimoResponsable : "Soporte");
        devMov.setArea(ultimaArea);
        devMov.setAccion("Devolución");
        devMov.setEstado("Finalizada");
        devMov.setFecha(ahora);
        devMov.setFechaDevolucion(ahora);
        devMov.setMotivo(motivo);
        devMov.setActorUid(actorUid);

        movimientoStockRepository.save(devMov);
        return toDTO(devMov);
    }

    public List<MovimientoStockDTO> listar() {
        List<MovimientoStockDTO> salida = new ArrayList<>();
        Set<String> codigosConMovimientoActivo = new HashSet<>();

        // 1. Movimientos reales persistidos en movimientos_stock
        try {
            List<MovimientoStock> persistidos = movimientoStockRepository.findAll();
            for (MovimientoStock m : persistidos) {
                if (m != null) {
                    salida.add(toDTO(m));
                    if ("Activa".equalsIgnoreCase(m.getEstado()) || "Pendiente".equalsIgnoreCase(m.getEstado())) {
                        if (m.getCodigo() != null && !m.getCodigo().isBlank()) {
                            codigosConMovimientoActivo.add(m.getCodigo().trim().toLowerCase());
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al leer movimientos_stock", ex);
        }

        // 2. Proyectar PCs ya asignadas que no tienen aún movimiento explícito en el libro
        try {
            List<Computadora> pcs = computadoraRepository.findAll();
            for (Computadora pc : pcs) {
                if (pc == null) continue;
                String resp = pc.getResponsableInventario();
                String estNombre = pc.getEstadoActual() != null ? pc.getEstadoActual().getNombre() : "";
                boolean asignada = (resp != null && !resp.isBlank()) || "Asignada".equalsIgnoreCase(estNombre);
                if (!asignada) continue;

                String cod = pc.getCodigoInterno();
                if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) {
                    continue; // ya tiene movimiento activo en movimientos_stock
                }

                String codFinal = (cod != null && !cod.isBlank())
                        ? cod
                        : ("PC-" + (pc.getUuid().length() >= 4 ? pc.getUuid().substring(0, 4) : pc.getUuid()));
                boolean esNotebook = pc.getTipoEquipo() != null && pc.getTipoEquipo().getTipo() != null
                        && pc.getTipoEquipo().getTipo().toLowerCase().contains("notebook");

                salida.add(MovimientoStockDTO.builder()
                        .id("proy-pc-" + pc.getUuid())
                        .codigo(codFinal)
                        .tipo(esNotebook ? "Notebook" : "Computadora")
                        .marca("")
                        .modelo(pc.getHostname() != null ? pc.getHostname() : "")
                        .serieOImei(pc.getSerialEquipo() != null ? pc.getSerialEquipo() : "")
                        .responsable(resp != null && !resp.isBlank() ? resp : "Responsable asignado")
                        .area(pc.getUbicacion() != null ? pc.getUbicacion().name() : "")
                        .accion("Asignación")
                        .estado("Activa")
                        .fecha("2026-10-01 09:00:00")
                        .motivo("Asignación existente")
                        .actorUid("SISTEMA")
                        .build());
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar PCs asignadas", ex);
        }

        // 3. Proyectar Celulares liberados/asignados que no tienen aún movimiento en el libro
        try {
            List<Celular> celulares = celularRepository.findAll();
            for (Celular cel : celulares) {
                if (cel == null) continue;
                String resp = cel.getResponsable();
                boolean liberado = (resp != null && !resp.isBlank()) || EstadoCelular.activo.name().equalsIgnoreCase(cel.getEstado());
                if (!liberado) continue;

                String cod = cel.getCodigoInterno();
                if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) {
                    continue; // ya tiene movimiento activo
                }

                String codFinal = (cod != null && !cod.isBlank())
                        ? cod
                        : ("CEL-" + (cel.getId().length() >= 4 ? cel.getId().substring(0, 4) : cel.getId()));

                salida.add(MovimientoStockDTO.builder()
                        .id("proy-cel-" + cel.getId())
                        .codigo(codFinal)
                        .tipo("Celular")
                        .marca(cel.getMarca() != null ? cel.getMarca() : "")
                        .modelo(cel.getModelo() != null ? cel.getModelo() : "")
                        .serieOImei(cel.getImei() != null ? cel.getImei() : "")
                        .responsable(resp != null && !resp.isBlank() ? resp : "Responsable asignado")
                        .area(cel.getArea() != null ? cel.getArea() : "")
                        .accion("Liberación de stock")
                        .estado("Activa")
                        .fecha("2026-10-01 09:00:00")
                        .motivo("Liberación existente")
                        .actorUid("SISTEMA")
                        .build());
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar celulares liberados", ex);
        }

        // Ordenar por fecha desc
        salida.sort(Comparator.comparing(MovimientoStockDTO::getFecha, Comparator.nullsLast(Comparator.reverseOrder())));
        return salida;
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

    private static Map<String, Object> mapaEstado(String nombre, String ambito, String motivo) {
        Map<String, Object> estado = new HashMap<>();
        estado.put("nombre", nombre);
        estado.put("ambito", ambito);
        estado.put("descripcion", motivo == null ? "" : motivo);
        return estado;
    }

    private static String normalizarTipoLabel(String tipo) {
        if (tipo == null || tipo.isBlank()) return "Activo";
        return switch (tipo.toLowerCase().trim()) {
            case "desktop" -> "Computadora";
            case "notebook" -> "Notebook";
            case "celular" -> "Celular";
            case "monitor" -> "Monitor";
            case "teclado" -> "Teclado";
            case "mouse" -> "Mouse";
            case "impresora" -> "Impresora";
            case "webcam" -> "Webcam";
            case "router" -> "Router";
            case "switch" -> "Switch";
            case "camara" -> "Cámara";
            case "televisor" -> "Televisor";
            default -> Character.toUpperCase(tipo.charAt(0)) + tipo.substring(1);
        };
    }

    private static MovimientoStockDTO toDTO(MovimientoStock m) {
        return MovimientoStockDTO.builder()
                .id(m.getId())
                .codigo(m.getCodigo())
                .tipo(m.getTipo())
                .marca(m.getMarca())
                .modelo(m.getModelo())
                .serieOImei(m.getSerieOImei())
                .responsable(m.getResponsable())
                .area(m.getArea())
                .accion(m.getAccion())
                .estado(m.getEstado())
                .fecha(m.getFecha())
                .fechaDevolucion(m.getFechaDevolucion())
                .motivo(m.getMotivo())
                .actorUid(m.getActorUid())
                .build();
    }
}
