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
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class StockAsignacionesService {

    private static final Logger log = LoggerFactory.getLogger(StockAsignacionesService.class);
    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MovimientoStockRepository movimientoStockRepository;
    private final StockUnidadesService stockUnidadesService;
    private final PerifericoManualRepository perifericoManualRepository;
    private final ComputadoraRepository computadoraRepository;
    private final CelularRepository celularRepository;
    private final AccessPointRepository accessPointRepository;

    public StockAsignacionesService(
            MovimientoStockRepository movimientoStockRepository,
            StockUnidadesService stockUnidadesService,
            PerifericoManualRepository perifericoManualRepository,
            ComputadoraRepository computadoraRepository,
            CelularRepository celularRepository,
            AccessPointRepository accessPointRepository) {
        this.movimientoStockRepository = movimientoStockRepository;
        this.stockUnidadesService = stockUnidadesService;
        this.perifericoManualRepository = perifericoManualRepository;
        this.computadoraRepository = computadoraRepository;
        this.celularRepository = celularRepository;
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
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String responsable = dto.getResponsable().trim();
        String area = dto.getArea() != null ? dto.getArea().trim() : "";
        String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Asignación de stock a " + responsable;

        String accion = "celular".equalsIgnoreCase(ficha.getTipo()) ? "Liberación de stock" : "Asignación";

        log.info("Stock Asignaciones: asignando codigo={} id={} a responsable='{}' por actor={}",
                codigo, id, responsable, actorUid);

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
        movimiento.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.ASIGNACION.name());
        movimiento.setPerifericoId(id);
        movimiento.setEstadoAnterior(ficha.getEstadoDeposito());
        movimiento.setEstadoNuevo("Asignada");
        movimiento.setUbicacionOrigen(ficha.getUbicacion());
        movimiento.setUbicacionDestino(area);

        movimientoStockRepository.save(movimiento);

        // 2. Se actualiza la ficha de la unidad
        try {
            Map<String, Object> updates = new HashMap<>();
            if (ColeccionesStock.COMPUTADORAS.equals(ficha.getColeccion())) {
                updates.put("responsable_inventario", responsable);
                updates.put("usuarioActual", responsable);
                if (!area.isBlank()) {
                    updates.put("ubicacion", area);
                }
                updates.put("estadoActual", mapaEstado("ASIGNADA", "STOCK", motivo));
                computadoraRepository.mergeUpdates(id, updates);
            } else if (ColeccionesStock.CELULARES.equals(ficha.getColeccion())) {
                updates.put("responsable", responsable);
                if (!area.isBlank()) {
                    updates.put("area", area);
                }
                updates.put("estado", "activo");
                celularRepository.update(id, updates);
            } else if (ColeccionesStock.ACCESS_POINTS.equals(ficha.getColeccion())) {
                Map<String, Object> apUpdates = new HashMap<>();
                apUpdates.put("estado", "OPERATIVO");
                if (!area.isBlank()) {
                    apUpdates.put("ubicacion", area);
                }
                accessPointRepository.actualizar(id, apUpdates);
            } else {
                updates.put("responsable", responsable);
                if (!area.isBlank()) {
                    updates.put("ubicacion", area);
                }
                updates.put("estadoActual", mapaEstado("ASIGNADA", "STOCK", motivo));
                perifericoManualRepository.actualizar(id, updates);
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
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String motivo = dto != null && dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Devolución a Disponible";

        log.info("Stock Asignaciones: devolviendo codigo={} id={} por actor={}",
                codigo, id, actorUid);

        // 1. Actualizar la ficha de la unidad para que vuelva a Disponible
        if (ColeccionesStock.COMPUTADORAS.equals(ficha.getColeccion())) {
            Map<String, Object> updates = new HashMap<>();
            updates.put("responsable_inventario", null);
            updates.put("usuarioActual", null);
            updates.put("ubicacion", "DEPOSITO");
            updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "STOCK", motivo));
            computadoraRepository.mergeUpdates(id, updates);
        } else if (ColeccionesStock.CELULARES.equals(ficha.getColeccion())) {
            Map<String, Object> updates = new HashMap<>();
            updates.put("responsable", null);
            updates.put("area", null);
            updates.put("estado", "en_stock");
            celularRepository.update(id, updates);
        } else if (ColeccionesStock.ACCESS_POINTS.equals(ficha.getColeccion())) {
            Map<String, Object> apUpdates = new HashMap<>();
            apUpdates.put("estado", "DISPONIBLE");
            apUpdates.put("ubicacion", "SISTEMAS");
            accessPointRepository.actualizar(id, apUpdates);
        } else {
            Map<String, Object> updates = new HashMap<>();
            updates.put("responsable", null);
            updates.put("ubicacion", "DEPOSITO");
            updates.put("computadora_hostname", null);
            updates.put("computadora_uuid", null);
            updates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "STOCK", motivo));
            perifericoManualRepository.actualizar(id, updates);
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
        devMov.setCodigo(ficha.getCodigoInterno() != null && !ficha.getCodigoInterno().isBlank()
                ? ficha.getCodigoInterno()
                : ficha.getId());
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
        devMov.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.DEVOLUCION.name());
        devMov.setPerifericoId(id);
        devMov.setEstadoAnterior("Asignada");
        devMov.setEstadoNuevo("Sin Asignar");
        devMov.setUbicacionOrigen(ultimaArea);
        devMov.setUbicacionDestino("DEPOSITO");

        movimientoStockRepository.save(devMov);
        return toDTO(devMov);
    }

    public List<MovimientoStockDTO> listar() {
        List<MovimientoStockDTO> salida = new ArrayList<>();
        Set<String> codigosConMovimientoActivo = new HashSet<>();

        // 1. Movimientos reales persistidos en movimientos_stock
        try {
            List<MovimientoStock> persistidos = movimientoStockRepository.findAll();
            if (persistidos != null) {
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
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al leer movimientos_stock", ex);
        }

        // 2. Proyectar periféricos y equipos de perifericos_manuales que están asignados
        try {
            List<PerifericoManual> perifericos = perifericoManualRepository.findAll();
            if (perifericos != null) {
                for (PerifericoManual p : perifericos) {
                    if (p == null) continue;

                    String resp = p.getResponsable();
                    String host = p.getComputadoraHostname();
                    String ubi = p.getUbicacion();
                    String estNombre = p.getEstadoActual() != null ? p.getEstadoActual().getNombre() : "";

                    boolean ubicacionOperativa = ubi != null && !ubi.isBlank() && !ProyeccionStock.esUbicacionDeposito(ubi);

                    boolean asignado = (resp != null && !resp.isBlank())
                            || ProyeccionStock.esEstadoOperativo(estNombre)
                            || (host != null && !host.isBlank())
                            || (p.getComputadoraUuid() != null && !p.getComputadoraUuid().isBlank())
                            || ubicacionOperativa;

                    if (!asignado) continue;

                    String cod = p.getCodigoInterno();
                    if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) {
                        continue; // ya tiene movimiento activo en movimientos_stock
                    }
                    if (p.getId() != null && codigosConMovimientoActivo.contains(p.getId().trim().toLowerCase())) {
                        continue;
                    }

                    String codFinal = (cod != null && !cod.isBlank()) ? cod : p.getId();
                    String responsableFinal = (resp != null && !resp.isBlank())
                            ? resp
                            : ((host != null && !host.isBlank())
                                    ? "PC: " + host
                                    : (p.getUbicacion() != null && !p.getUbicacion().isBlank()
                                            ? p.getUbicacion()
                                            : "Operativo / En uso"));

                    String fecha = (p.getFechaAlta() != null && !p.getFechaAlta().isBlank())
                            ? p.getFechaAlta()
                            : "2026-01-01 00:00:00";

                    salida.add(MovimientoStockDTO.builder()
                            .id("proy-perif-" + p.getId())
                            .codigo(codFinal)
                            .tipo(normalizarTipoLabel(p.getTipo()))
                            .marca(p.getFabricante() != null ? p.getFabricante() : "")
                            .modelo(p.getNombre() != null ? p.getNombre() : "")
                            .serieOImei(p.getNumeroSerie() != null ? p.getNumeroSerie() : "")
                            .responsable(responsableFinal)
                            .area(p.getUbicacion() != null ? p.getUbicacion() : "")
                            .accion("Asignación")
                            .estado("Activa")
                            .fecha(fecha)
                            .motivo("Asignación en inventario")
                            .actorUid("SISTEMA")
                            .build());
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar perifericos_manuales asignados", ex);
        }

        // 3. Proyectar PCs de computadoras con origen STOCK que están asignadas
        try {
            List<Computadora> pcs = computadoraRepository.findAll();
            if (pcs != null) {
                for (Computadora pc : pcs) {
                    if (pc == null) continue;
                    if (pc.getOrigenAlta() != OrigenAlta.STOCK) continue;

                    String resp = pc.getResponsableInventario();
                    String user = pc.getUsuarioActual();
                    String estNombre = pc.getEstadoActual() != null ? pc.getEstadoActual().getNombre() : "";

                    boolean asignada = (resp != null && !resp.isBlank())
                            || (user != null && !user.isBlank())
                            || ProyeccionStock.esEstadoOperativo(estNombre);

                    if (!asignada) continue;

                    String cod = pc.getCodigoInterno();
                    if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) {
                        continue; // ya tiene movimiento activo en movimientos_stock
                    }
                    if (pc.getUuid() != null && codigosConMovimientoActivo.contains(pc.getUuid().trim().toLowerCase())) {
                        continue;
                    }

                    String codFinal = (cod != null && !cod.isBlank()) ? cod : pc.getUuid();
                    String responsableFinal = (resp != null && !resp.isBlank())
                            ? resp
                            : ((user != null && !user.isBlank()) ? user : "Responsable asignado");

                    boolean esNotebook = pc.getTipoEquipo() != null && pc.getTipoEquipo().getTipo() != null
                            && pc.getTipoEquipo().getTipo().toLowerCase().contains("notebook");

                    String modelo = pc.getHostname() != null && !pc.getHostname().isBlank()
                            ? pc.getHostname()
                            : (pc.getDescripcionStock() != null ? pc.getDescripcionStock() : "");

                    String area = pc.getUbicacion() != null ? pc.getUbicacion().name() : "";

                    salida.add(MovimientoStockDTO.builder()
                            .id("proy-pc-" + pc.getUuid())
                            .codigo(codFinal)
                            .tipo(esNotebook ? "Notebook" : "Computadora")
                            .marca("")
                            .modelo(modelo)
                            .serieOImei(pc.getSerialEquipo() != null ? pc.getSerialEquipo() : "")
                            .responsable(responsableFinal)
                            .area(area)
                            .accion("Asignación")
                            .estado("Activa")
                            .fecha("2026-01-01 00:00:00")
                            .motivo("Asignación de stock existente")
                            .actorUid("SISTEMA")
                            .build());
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar computadoras asignadas de stock", ex);
        }

        // 4. Proyectar celulares asignados o activos
        try {
            List<Celular> celulares = celularRepository.findAll();
            if (celulares != null) {
                for (Celular cel : celulares) {
                    if (cel == null) continue;

                    String resp = cel.getResponsable();
                    String est = cel.getEstado();

                    boolean asignado = (resp != null && !resp.isBlank())
                            || "activo".equalsIgnoreCase(est)
                            || ProyeccionStock.esEstadoOperativo(est);

                    if (!asignado) continue;

                    String cod = cel.getCodigoInterno();
                    if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) {
                        continue;
                    }
                    if (cel.getId() != null && codigosConMovimientoActivo.contains(cel.getId().trim().toLowerCase())) {
                        continue;
                    }

                    String codFinal = (cod != null && !cod.isBlank()) ? cod : cel.getId();
                    String responsableFinal = (resp != null && !resp.isBlank()) ? resp : "Responsable asignado";
                    String modelo = cel.getModelo() != null ? cel.getModelo() : "";
                    String marca = cel.getMarca() != null ? cel.getMarca() : "";
                    String imei = cel.getImei() != null ? cel.getImei() : "";
                    String area = cel.getArea() != null ? cel.getArea() : "";

                    salida.add(MovimientoStockDTO.builder()
                            .id("proy-cel-" + cel.getId())
                            .codigo(codFinal)
                            .tipo("Celular")
                            .marca(marca)
                            .modelo(modelo)
                            .serieOImei(imei)
                            .responsable(responsableFinal)
                            .area(area)
                            .accion("Liberación de stock")
                            .estado("Activa")
                            .fecha("2026-01-01 00:00:00")
                            .motivo("Asignación de stock celular")
                            .actorUid("SISTEMA")
                            .build());
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar celulares asignados", ex);
        }

        // 5. Proyectar access points de la colección access_points
        try {
            List<AccessPoint> aps = accessPointRepository.findAll();
            if (aps != null) {
                for (AccessPoint ap : aps) {
                    if (ap == null) continue;
                    String cod = ap.getCodigoInterno();
                    if (cod != null && codigosConMovimientoActivo.contains(cod.trim().toLowerCase())) continue;
                    if (ap.getId() != null && codigosConMovimientoActivo.contains(ap.getId().trim().toLowerCase())) continue;

                    String ubicacion = ap.getUbicacion() != null ? ap.getUbicacion().name() : "";
                    String estado = ap.getEstado() != null ? ap.getEstado() : "OPERATIVO";
                    if (!ProyeccionStock.esEstadoOperativo(estado) && ProyeccionStock.esUbicacionDeposito(ubicacion)) {
                        continue;
                    }

                    String codFinal = (cod != null && !cod.isBlank()) ? cod : ap.getId();
                    String responsableFinal = !ubicacion.isBlank() ? ubicacion : "Infraestructura";
                    String modelo = ap.getModelo() != null && !ap.getModelo().isBlank()
                            ? ap.getModelo()
                            : (ap.getNombre() != null ? ap.getNombre() : "");

                    salida.add(MovimientoStockDTO.builder()
                            .id("proy-ap-" + ap.getId())
                            .codigo(codFinal)
                            .tipo("Access Point")
                            .marca(ap.getMarca() != null ? ap.getMarca() : "")
                            .modelo(modelo)
                            .serieOImei(ap.getMac() != null ? ap.getMac() : "")
                            .responsable(responsableFinal)
                            .area(ubicacion)
                            .accion("Asignación")
                            .estado("Activa")
                            .fecha("2026-01-01 00:00:00")
                            .motivo("Infraestructura de red operativa")
                            .actorUid("SISTEMA")
                            .build());
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al proyectar access points", ex);
        }

        salida.sort(Comparator.comparing(MovimientoStockDTO::getFecha, Comparator.nullsLast(Comparator.reverseOrder())));
        return salida;
    }

    private FichaLectura buscarFicha(String codigo) {
        String codigoLimpio = codigo.trim();
        for (FichaLectura ficha : stockUnidadesService.leerFichas()) {
            if (codigoLimpio.equalsIgnoreCase(ficha.getCodigoInterno())
                    || codigoLimpio.equalsIgnoreCase(ficha.getId())) {
                return ficha;
            }
        }
        try {
            List<Computadora> pcs = computadoraRepository.findAll();
            if (pcs != null) {
                for (Computadora pc : pcs) {
                    if (pc != null && (codigoLimpio.equalsIgnoreCase(pc.getCodigoInterno())
                            || codigoLimpio.equalsIgnoreCase(pc.getUuid()))) {
                        return ProyeccionStock.desdeComputadora(pc);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al buscar PC en computadoraRepository para codigo {}", codigo, ex);
        }
        try {
            List<AccessPoint> aps = accessPointRepository.findAll();
            if (aps != null) {
                for (AccessPoint ap : aps) {
                    if (ap != null && (codigoLimpio.equalsIgnoreCase(ap.getCodigoInterno())
                            || codigoLimpio.equalsIgnoreCase(ap.getId()))) {
                        return ProyeccionStock.desdeAccessPoint(ap);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al buscar AP en accessPointRepository para codigo {}", codigo, ex);
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
            case "access_point", "access point", "ap" -> "Access Point";
            case "camara", "cámara", "camara_ip", "cámara_ip" -> "Cámara";
            case "televisor" -> "Televisor";
            case "telefono_ip", "teléfono ip" -> "Teléfono IP";
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
