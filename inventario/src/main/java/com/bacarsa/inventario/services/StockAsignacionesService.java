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
import com.bacarsa.inventario.historial.ComputadoraHistorialReglas;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Celular;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.CelularRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.MovimientoStockRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;
import com.google.cloud.Timestamp;

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
    private final StockFichaRepository stockFichaRepository;

    public StockAsignacionesService(
            MovimientoStockRepository movimientoStockRepository,
            StockUnidadesService stockUnidadesService,
            PerifericoManualRepository perifericoManualRepository,
            ComputadoraRepository computadoraRepository,
            CelularRepository celularRepository,
            AccessPointRepository accessPointRepository) {
        this(movimientoStockRepository, stockUnidadesService, perifericoManualRepository,
                computadoraRepository, celularRepository, accessPointRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public StockAsignacionesService(
            MovimientoStockRepository movimientoStockRepository,
            StockUnidadesService stockUnidadesService,
            PerifericoManualRepository perifericoManualRepository,
            ComputadoraRepository computadoraRepository,
            CelularRepository celularRepository,
            AccessPointRepository accessPointRepository,
            StockFichaRepository stockFichaRepository) {
        this.movimientoStockRepository = movimientoStockRepository;
        this.stockUnidadesService = stockUnidadesService;
        this.perifericoManualRepository = perifericoManualRepository;
        this.computadoraRepository = computadoraRepository;
        this.celularRepository = celularRepository;
        this.accessPointRepository = accessPointRepository;
        this.stockFichaRepository = stockFichaRepository;
    }

    public MovimientoStockDTO asignar(String codigo, AsignarUnidadStockDTO dto, String uid) throws Exception {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        if (dto == null) {
            throw new IllegalArgumentException("Los datos de asignación son obligatorios");
        }
        boolean esArea = "AREA".equalsIgnoreCase(dto.getAsignacionTipo());
        String tipoAsignacion = esArea ? "AREA" : "PERSONA";

        if (esArea) {
            if (dto.getArea() == null || dto.getArea().isBlank()) {
                throw new IllegalArgumentException("El área de destino es obligatoria para una asignación a área");
            }
        } else {
            if (dto.getResponsable() == null || dto.getResponsable().isBlank()) {
                throw new IllegalArgumentException("El nombre del responsable es obligatorio");
            }
        }

        int cantidadSolicitada = dto.getCantidad() != null && dto.getCantidad() > 0 ? dto.getCantidad() : 1;
        StockFicha fichaLote = buscarFichaStock(codigo);
        if (fichaLote != null) {
            int disponible = fichaLote.getCantidad() != null ? fichaLote.getCantidad() : 1;
            if (cantidadSolicitada > disponible) {
                throw new IllegalArgumentException("La cantidad solicitada (" + cantidadSolicitada
                        + ") supera la disponible (" + disponible + ")");
            }
            if (cantidadSolicitada < disponible) {
                return asignarDesdeLote(fichaLote, cantidadSolicitada, dto, esArea, uid);
            }
        }

        FichaLectura ficha = buscarFicha(codigo);
        int disponibleFicha = ficha.getCantidad() != null && ficha.getCantidad() > 0 ? ficha.getCantidad() : 1;
        if (fichaLote == null) {
            if (cantidadSolicitada > disponibleFicha) {
                throw new IllegalArgumentException("La cantidad solicitada (" + cantidadSolicitada
                        + ") supera la disponible (" + disponibleFicha + ")");
            }
            if (cantidadSolicitada < disponibleFicha
                    && ColeccionesStock.PERIFERICOS_MANUALES.equals(ficha.getColeccion())) {
                return asignarDesdeLoteLegacy(ficha, cantidadSolicitada, disponibleFicha, dto, esArea, uid);
            }
        }
        String id = ficha.getId();
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String area = dto.getArea() != null ? dto.getArea().trim() : "";
        String responsable = (!esArea && dto.getResponsable() != null) ? dto.getResponsable().trim() : "";
        String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : (esArea ? "Asignación de stock al área " + area : "Asignación de stock a " + responsable);

        String accion = "celular".equalsIgnoreCase(ficha.getTipo()) ? "Liberación de stock" : "Asignación";

        log.info("Stock Asignaciones: asignando codigo={} id={} tipo='{}' a='{}' por actor={}",
                codigo, id, tipoAsignacion, esArea ? area : responsable, actorUid);

        // 1. El movimiento se escribe primero en Firestore con estado "Pendiente"
        String movimientoId = UUID.randomUUID().toString();
        MovimientoStock movimiento = new MovimientoStock();
        movimiento.setId(movimientoId);
        movimiento.setCodigo(ficha.getCodigoInterno());
        movimiento.setFichaCodigo(ficha.getCodigoInterno() != null ? ficha.getCodigoInterno() : codigo);
        movimiento.setTipo(normalizarTipoLabel(ficha.getTipo()));
        movimiento.setMarca(ficha.getMarca());
        movimiento.setModelo(ficha.getModelo());
        movimiento.setSerieOImei(ficha.getSerieOImei());
        movimiento.setResponsable(esArea ? ("Área: " + area) : responsable);
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
        movimiento.setDescripcionCompleta(ficha.getDescripcionCompleta());
        movimiento.setUbicacionOrigen(ficha.getUbicacion());
        movimiento.setUbicacionDestino(area);
        movimiento.setCantidad(cantidadSolicitada);

        movimientoStockRepository.save(movimiento);

        // 2. Se actualiza la ficha de la unidad
        try {
            Map<String, Object> updates = new HashMap<>();
            if (ColeccionesStock.COMPUTADORAS.equals(ficha.getColeccion())) {
                if (esArea) {
                    updates.put("responsable_inventario", null);
                    updates.put("usuarioActual", null);
                    updates.put("ubicacion", area);
                } else {
                    updates.put("responsable_inventario", responsable);
                    updates.put("usuarioActual", responsable);
                    if (!area.isBlank()) {
                        updates.put("ubicacion", area);
                    }
                }
                updates.put("en_deposito", false);
                updates.put("estadoActual", mapaEstado("ASIGNADA", "STOCK", motivo));
                cerrarTramoLegacyDePc(id, updates);
                computadoraRepository.mergeUpdates(id, updates);
            } else if (ColeccionesStock.CELULARES.equals(ficha.getColeccion())) {
                updates.put("responsable", esArea ? ("Área: " + area) : responsable);
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
                updates.put("responsable", esArea ? ("Área: " + area) : responsable);
                if (!area.isBlank()) {
                    updates.put("ubicacion", area);
                }
                updates.put("estadoActual", mapaEstado("ASIGNADA", "STOCK", motivo));
                perifericoManualRepository.actualizar(id, updates);
            }

            if (stockFichaRepository != null) {
                try {
                    String codFicha = ficha.getCodigoInterno() != null && !ficha.getCodigoInterno().isBlank()
                            ? ficha.getCodigoInterno()
                            : codigo;
                    StockFicha fichaStock = stockFichaRepository.findById(codFicha);
                    if (fichaStock != null) {
                        fichaStock.setEstado("ASIGNADA");
                        fichaStock.setResponsableNombre(esArea ? null : responsable);
                        String respId = dto.getResponsableId() != null && !dto.getResponsableId().isBlank()
                                ? dto.getResponsableId()
                                : com.bacarsa.inventario.util.ResponsableSlugHelper.slugDeNombre(responsable);
                        fichaStock.setResponsableId(esArea ? null : respId);
                        fichaStock.setArea(area);
                        if (!area.isBlank()) {
                            fichaStock.setUbicacion(area);
                        }
                        fichaStock.setUpdatedAt(Timestamp.now());
                        stockFichaRepository.save(fichaStock);
                    }
                } catch (Exception exFicha) {
                    log.error("Stock Asignaciones: error al actualizar ficha de stock {}", codigo, exFicha);
                }
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

        StockFicha fichaHija = buscarFichaStock(codigo);
        if (fichaHija != null && fichaHija.getLoteOrigen() != null && !fichaHija.getLoteOrigen().isBlank()) {
            return devolverALote(fichaHija, dto, uid);
        }

        MovimientoStock movHijaLegacy = buscarMovimientoHijaActivo(codigo);
        if (movHijaLegacy != null) {
            return devolverALoteLegacy(movHijaLegacy, dto, uid);
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
            cerrarTramoLegacyDePc(id, updates);
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
        String devCodigo = ficha.getCodigoInterno() != null && !ficha.getCodigoInterno().isBlank()
                ? ficha.getCodigoInterno()
                : ficha.getId();
        devMov.setCodigo(devCodigo);
        devMov.setFichaCodigo(devCodigo);
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
        devMov.setDescripcionCompleta(ficha.getDescripcionCompleta());
        devMov.setUbicacionOrigen(ultimaArea);
        devMov.setUbicacionDestino("DEPOSITO");
        devMov.setCantidad(ficha.getCantidad() != null && ficha.getCantidad() > 0 ? ficha.getCantidad() : 1);

        if (stockFichaRepository != null) {
            try {
                StockFicha fichaStock = stockFichaRepository.findById(devCodigo);
                if (fichaStock != null) {
                    devMov.setCantidad(fichaStock.getCantidad() != null ? fichaStock.getCantidad() : 1);
                    fichaStock.setEstado("EN_DEPOSITO");
                    fichaStock.setResponsableNombre(null);
                    fichaStock.setResponsableId(null);
                    fichaStock.setArea(null);
                    fichaStock.setUbicacion("Depósito Sistemas");
                    fichaStock.setUpdatedAt(Timestamp.now());
                    stockFichaRepository.save(fichaStock);
                }
            } catch (Exception exFicha) {
                log.error("Stock Asignaciones: error al devolver en stock_fichas {}", devCodigo, exFicha);
            }
        }

        movimientoStockRepository.save(devMov);
        return toDTO(devMov);
    }

    public List<MovimientoStockDTO> listar() {
        if (stockFichaRepository != null) {
            try {
                List<StockFicha> fichas = stockFichaRepository.findAll();
                if (fichas != null && !fichas.isEmpty()) {
                    List<MovimientoStockDTO> asignadas = new ArrayList<>();
                    for (StockFicha f : fichas) {
                        if (f != null && "ASIGNADA".equalsIgnoreCase(f.getEstado())) {
                            String resp = f.getResponsableNombre();
                            String area = f.getArea();
                            String fecha = f.getUpdatedAt() != null ? f.getUpdatedAt().toString() : "";
                            asignadas.add(MovimientoStockDTO.builder()
                                    .id(f.getCodigoInterno())
                                    .codigo(f.getCodigoInterno())
                                    .tipo(f.getTipo() != null ? f.getTipo().toLowerCase(java.util.Locale.ROOT) : "")
                                    .marca(f.getMarca() != null ? f.getMarca() : "")
                                    .modelo(f.getModelo() != null ? f.getModelo() : "")
                                    .serieOImei(f.getSerieOImei() != null ? f.getSerieOImei() : "")
                                    .cantidad(f.getCantidad() != null ? f.getCantidad() : 1)
                                    .loteOrigen(f.getLoteOrigen())
                                    .responsable(resp != null && !resp.isBlank() ? resp : (area != null && !area.isBlank() ? ("Área: " + area) : "Asignada"))
                                    .area(area != null ? area : "")
                                    .accion("Asignación")
                                    .estado("Activa")
                                    .fecha(fecha)
                                    .motivo(f.getNotas() != null && !f.getNotas().isBlank() ? f.getNotas() : "Asignación")
                                    .actorUid("SISTEMA")
                                    .descripcionCompleta(f.getDescripcion() != null ? f.getDescripcion() : "")
                                    .build());
                        }
                    }
                    return asignadas;
                }
            } catch (Exception ex) {
                log.error("Stock Asignaciones: error al leer de stock_fichas, fallback a proyección legacy", ex);
            }
        }

        List<MovimientoStockDTO> salida = new ArrayList<>();
        Set<String> codigosConMovimientoActivo = new HashSet<>();

        // 1. Movimientos reales persistidos en movimientos_stock
        try {
            List<MovimientoStock> persistidos = movimientoStockRepository.findAll();
            if (persistidos != null) {
                Map<String, String> descPorCodigo = new HashMap<>();
                for (FichaLectura f : stockUnidadesService.leerFichas()) {
                    if (f.getCodigoInterno() != null && !f.getCodigoInterno().isBlank()
                            && f.getDescripcionCompleta() != null && !f.getDescripcionCompleta().isBlank()) {
                        descPorCodigo.put(f.getCodigoInterno().trim().toLowerCase(), f.getDescripcionCompleta());
                    }
                }
                for (MovimientoStock m : persistidos) {
                    if (m != null && esMovimientoAsignacionActiva(m)) {
                        MovimientoStockDTO dto = toDTO(m);
                        if ((dto.getDescripcionCompleta() == null || dto.getDescripcionCompleta().isBlank()) && m.getCodigo() != null) {
                            String desc = descPorCodigo.get(m.getCodigo().trim().toLowerCase());
                            if (desc != null) {
                                dto.setDescripcionCompleta(desc);
                            }
                        }
                        salida.add(dto);
                        if (m.getCodigo() != null && !m.getCodigo().isBlank()) {
                            codigosConMovimientoActivo.add(m.getCodigo().trim().toLowerCase());
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

                    String descPerif = ProyeccionStock.descripcionDesdeSpec(p.getEspecificacionStock());
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
                            .descripcionCompleta(descPerif)
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

                    String descPc = pc.getDescripcionStock() != null && !pc.getDescripcionStock().isBlank()
                            ? pc.getDescripcionStock()
                            : ProyeccionStock.descripcionDesdeSpec(pc.getEspecificacionEsperada());

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
                            .descripcionCompleta(descPc)
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

    /** Cierra el tramo abierto de historialEstados para que el detalle no muestre un estado viejo. */
    private void cerrarTramoLegacyDePc(String id, Map<String, Object> updates) throws Exception {
        var snap = computadoraRepository.getDocumentSnapshot(id);
        if (snap == null || !snap.exists()) {
            return;
        }
        var cerrado = ComputadoraHistorialReglas.cerrarTramosLegacyAbiertos(
                snap.get("historialEstados"), com.google.cloud.Timestamp.now());
        if (cerrado != null) {
            updates.put("historialEstados", cerrado);
        }
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

    private StockFicha buscarFichaStock(String codigo) {
        if (stockFichaRepository == null || codigo == null || codigo.isBlank()) return null;
        try {
            return stockFichaRepository.findById(codigo.trim());
        } catch (Exception ex) {
            log.warn("Stock Asignaciones: no se pudo leer stock_fichas/{}: {}", codigo, ex.getMessage());
            return null;
        }
    }

    private String siguienteCodigoHija(String codigoLote) throws Exception {
        int n = 1;
        Set<String> usados = new HashSet<>();
        if (stockFichaRepository != null) {
            List<StockFicha> todas = stockFichaRepository.findAll();
            if (todas != null) {
                for (StockFicha f : todas) {
                    if (f != null) {
                        if (codigoLote.equalsIgnoreCase(f.getLoteOrigen())) n++;
                        if (f.getCodigoInterno() != null) usados.add(f.getCodigoInterno().trim().toUpperCase());
                    }
                }
            }
        }
        List<MovimientoStock> movs = movimientoStockRepository.findAll();
        if (movs != null) {
            for (MovimientoStock m : movs) {
                if (m != null && m.getCodigo() != null) {
                    usados.add(m.getCodigo().trim().toUpperCase());
                }
            }
        }
        String candidato = codigoLote + "-A" + n;
        while (usados.contains(candidato.toUpperCase())
                || (stockFichaRepository != null && stockFichaRepository.findById(candidato) != null)) {
            n++;
            candidato = codigoLote + "-A" + n;
        }
        return candidato;
    }

    private MovimientoStockDTO asignarDesdeLoteLegacy(FichaLectura lote, int cantidad, int disponible,
            AsignarUnidadStockDTO dto, boolean esArea, String uid) throws Exception {
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String area = dto.getArea() != null ? dto.getArea().trim() : "";
        String responsable = (!esArea && dto.getResponsable() != null) ? dto.getResponsable().trim() : "";
        String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : (esArea ? "Asignación de stock al área " + area : "Asignación de stock a " + responsable);

        String codigoLote = lote.getCodigoInterno() != null && !lote.getCodigoInterno().isBlank()
                ? lote.getCodigoInterno()
                : lote.getId();
        String codigoHija = siguienteCodigoHija(codigoLote);
        String accion = "celular".equalsIgnoreCase(lote.getTipo()) ? "Liberación de stock" : "Asignación";

        log.info("Stock Asignaciones (legacy): asignación parcial lote={} cantidad={} hija={} a='{}' por actor={}",
                codigoLote, cantidad, codigoHija, esArea ? area : responsable, actorUid);

        MovimientoStock mov = new MovimientoStock();
        mov.setId(UUID.randomUUID().toString());
        mov.setCodigo(codigoHija);
        mov.setFichaCodigo(codigoHija);
        mov.setLoteOrigen(codigoLote);
        mov.setCantidad(cantidad);
        mov.setPerifericoId(lote.getId());
        mov.setTipo(normalizarTipoLabel(lote.getTipo()));
        mov.setMarca(lote.getMarca());
        mov.setModelo(lote.getModelo());
        mov.setSerieOImei(lote.getSerieOImei());
        mov.setResponsable(esArea ? ("Área: " + area) : responsable);
        mov.setArea(area);
        mov.setAccion(accion);
        mov.setEstado("Pendiente");
        mov.setFecha(ahora);
        mov.setMotivo(motivo);
        mov.setActorUid(actorUid);
        mov.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.ASIGNACION.name());
        mov.setEstadoAnterior(lote.getEstadoDeposito());
        mov.setEstadoNuevo("Asignada");
        mov.setDescripcionCompleta(lote.getDescripcionCompleta());
        mov.setUbicacionOrigen(lote.getUbicacion());
        mov.setUbicacionDestino(area);
        movimientoStockRepository.save(mov);

        try {
            perifericoManualRepository.actualizar(lote.getId(), Map.of("cantidad", disponible - cantidad));
            movimientoStockRepository.update(mov.getId(), Map.of("estado", "Activa"));
            mov.setEstado("Activa");
        } catch (Exception ex) {
            log.error("Stock Asignaciones (legacy): fallo en asignación parcial lote={} hija={}. El movimiento permanece Pendiente.",
                    codigoLote, codigoHija, ex);
            throw ex;
        }
        return toDTO(mov);
    }

    private MovimientoStock buscarMovimientoHijaActivo(String codigo) {
        if (codigo == null || codigo.isBlank()) return null;
        String limpio = codigo.trim();
        try {
            List<MovimientoStock> movs = movimientoStockRepository.findAll();
            if (movs == null) return null;
            for (MovimientoStock m : movs) {
                if (m != null
                        && limpio.equalsIgnoreCase(m.getCodigo())
                        && m.getLoteOrigen() != null && !m.getLoteOrigen().isBlank()
                        && ("Activa".equalsIgnoreCase(m.getEstado()) || "Pendiente".equalsIgnoreCase(m.getEstado()))) {
                    return m;
                }
            }
        } catch (Exception ex) {
            log.warn("Stock Asignaciones: error al buscar movimiento hija activo para {}: {}", codigo, ex.getMessage());
        }
        return null;
    }

    private MovimientoStockDTO devolverALoteLegacy(MovimientoStock movHija, DevolverUnidadStockDTO dto, String uid) throws Exception {
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String motivo = dto != null && dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Devolución a Disponible";

        int asignadas = movHija.getCantidad() != null && movHija.getCantidad() > 0 ? movHija.getCantidad() : 1;
        int aDevolver = dto != null && dto.getCantidad() != null && dto.getCantidad() > 0 ? dto.getCantidad() : asignadas;
        if (aDevolver > asignadas) {
            throw new IllegalArgumentException("La cantidad a devolver (" + aDevolver
                    + ") supera la asignada (" + asignadas + ")");
        }

        FichaLectura lote = buscarFicha(movHija.getLoteOrigen());
        int cantidadLote = lote.getCantidad() != null && lote.getCantidad() > 0 ? lote.getCantidad() : 0;
        if ("ASIGNADA".equalsIgnoreCase(lote.getEstadoDeposito())) {
            cantidadLote = 0;
        }

        Map<String, Object> loteUpdates = new HashMap<>();
        loteUpdates.put("cantidad", cantidadLote + aDevolver);
        if ("ASIGNADA".equalsIgnoreCase(lote.getEstadoDeposito())) {
            loteUpdates.put("responsable", null);
            loteUpdates.put("ubicacion", "DEPOSITO");
            loteUpdates.put("computadora_hostname", null);
            loteUpdates.put("computadora_uuid", null);
            loteUpdates.put("estadoActual", mapaEstado("SIN_ASIGNAR", "STOCK", motivo));
        }
        perifericoManualRepository.actualizar(lote.getId(), loteUpdates);

        int restante = asignadas - aDevolver;
        if (restante == 0) {
            movimientoStockRepository.update(movHija.getId(), Map.of(
                    "estado", "Finalizada",
                    "fecha_devolucion", ahora));
        } else {
            movimientoStockRepository.update(movHija.getId(), Map.of("cantidad", restante));
        }

        String codigoHija = movHija.getCodigo();
        String ultimoResponsable = movHija.getResponsable() != null && !movHija.getResponsable().isBlank()
                ? movHija.getResponsable()
                : "Soporte";
        String ultimaArea = movHija.getArea() != null ? movHija.getArea() : "";

        MovimientoStock devMov = new MovimientoStock();
        devMov.setId(UUID.randomUUID().toString());
        devMov.setCodigo(codigoHija);
        devMov.setFichaCodigo(codigoHija);
        devMov.setLoteOrigen(movHija.getLoteOrigen());
        devMov.setCantidad(aDevolver);
        devMov.setPerifericoId(lote.getId());
        devMov.setTipo(movHija.getTipo() != null ? movHija.getTipo() : normalizarTipoLabel(lote.getTipo()));
        devMov.setMarca(movHija.getMarca() != null ? movHija.getMarca() : lote.getMarca());
        devMov.setModelo(movHija.getModelo() != null ? movHija.getModelo() : lote.getModelo());
        devMov.setSerieOImei(movHija.getSerieOImei() != null ? movHija.getSerieOImei() : lote.getSerieOImei());
        devMov.setResponsable(ultimoResponsable);
        devMov.setArea(ultimaArea);
        devMov.setAccion("Devolución");
        devMov.setEstado("Finalizada");
        devMov.setFecha(ahora);
        devMov.setFechaDevolucion(ahora);
        devMov.setMotivo(motivo);
        devMov.setActorUid(actorUid);
        devMov.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.DEVOLUCION.name());
        devMov.setEstadoAnterior("Asignada");
        devMov.setEstadoNuevo("Sin Asignar");
        devMov.setDescripcionCompleta(movHija.getDescripcionCompleta() != null && !movHija.getDescripcionCompleta().isBlank()
                ? movHija.getDescripcionCompleta()
                : lote.getDescripcionCompleta());
        devMov.setUbicacionOrigen(ultimaArea);
        devMov.setUbicacionDestino("DEPOSITO");
        movimientoStockRepository.save(devMov);
        return toDTO(devMov);
    }

    /**
     * Asignación parcial: descuenta {@code cantidad} del lote y crea una ficha hija ASIGNADA
     * (un único ítem en Asignaciones) con trazabilidad al lote de origen.
     */
    private MovimientoStockDTO asignarDesdeLote(StockFicha lote, int cantidad, AsignarUnidadStockDTO dto,
            boolean esArea, String uid) throws Exception {
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String area = dto.getArea() != null ? dto.getArea().trim() : "";
        String responsable = (!esArea && dto.getResponsable() != null) ? dto.getResponsable().trim() : "";
        String motivo = dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : (esArea ? "Asignación de stock al área " + area : "Asignación de stock a " + responsable);

        String codigoLote = lote.getCodigoInterno();
        int disponible = lote.getCantidad() != null ? lote.getCantidad() : 1;
        String codigoHija = siguienteCodigoHija(codigoLote);

        log.info("Stock Asignaciones: asignación parcial lote={} cantidad={} hija={} a='{}' por actor={}",
                codigoLote, cantidad, codigoHija, esArea ? area : responsable, actorUid);

        MovimientoStock mov = new MovimientoStock();
        mov.setId(UUID.randomUUID().toString());
        mov.setCodigo(codigoHija);
        mov.setFichaCodigo(codigoHija);
        mov.setLoteOrigen(codigoLote);
        mov.setCantidad(cantidad);
        mov.setTipo(normalizarTipoLabel(lote.getTipo()));
        mov.setMarca(lote.getMarca());
        mov.setModelo(lote.getModelo());
        mov.setSerieOImei(lote.getSerieOImei());
        mov.setResponsable(esArea ? ("Área: " + area) : responsable);
        mov.setArea(area);
        mov.setAccion("Asignación");
        mov.setEstado("Pendiente");
        mov.setFecha(ahora);
        mov.setMotivo(motivo);
        mov.setActorUid(actorUid);
        mov.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.ASIGNACION.name());
        mov.setEstadoAnterior(lote.getEstado());
        mov.setEstadoNuevo("Asignada");
        mov.setDescripcionCompleta(lote.getDescripcion());
        mov.setUbicacionOrigen(lote.getUbicacion());
        mov.setUbicacionDestino(area);
        movimientoStockRepository.save(mov);

        try {
            Timestamp now = Timestamp.now();
            String respId = dto.getResponsableId() != null && !dto.getResponsableId().isBlank()
                    ? dto.getResponsableId()
                    : com.bacarsa.inventario.util.ResponsableSlugHelper.slugDeNombre(responsable);
            StockFicha hija = StockFicha.builder()
                    .codigoInterno(codigoHija)
                    .tipo(lote.getTipo())
                    .descripcion(lote.getDescripcion())
                    .marca(lote.getMarca())
                    .modelo(lote.getModelo())
                    .serieOImei(lote.getSerieOImei())
                    .estado("ASIGNADA")
                    .responsableId(esArea ? null : respId)
                    .responsableNombre(esArea ? null : responsable)
                    .area(area)
                    .ubicacion(!area.isBlank() ? area : lote.getUbicacion())
                    .condicion(lote.getCondicion())
                    .refOrigen(lote.getRefOrigen())
                    .cantidad(cantidad)
                    .loteOrigen(codigoLote)
                    .createdAt(now)
                    .updatedAt(now)
                    .notas(motivo)
                    .build();
            stockFichaRepository.save(hija);

            lote.setCantidad(disponible - cantidad);
            lote.setUpdatedAt(now);
            stockFichaRepository.save(lote);

            movimientoStockRepository.update(mov.getId(), Map.of("estado", "Activa"));
            mov.setEstado("Activa");
        } catch (Exception ex) {
            log.error("Stock Asignaciones: fallo en asignación parcial lote={} hija={}. El movimiento permanece Pendiente.",
                    codigoLote, codigoHija, ex);
            throw ex;
        }
        return toDTO(mov);
    }

    /**
     * Devolución (total o parcial) de una ficha hija: reintegra las unidades al lote de origen.
     */
    private MovimientoStockDTO devolverALote(StockFicha hija, DevolverUnidadStockDTO dto, String uid) throws Exception {
        String actorUid = (uid == null || uid.isBlank()) ? "SISTEMA" : uid.trim();
        String ahora = LocalDateTime.now().format(FORMATO_FECHA_HORA);
        String motivo = dto != null && dto.getMotivo() != null && !dto.getMotivo().isBlank()
                ? dto.getMotivo().trim()
                : "Devolución a Disponible";

        if (!"ASIGNADA".equalsIgnoreCase(hija.getEstado())) {
            throw new IllegalArgumentException("La asignación " + hija.getCodigoInterno() + " ya fue devuelta");
        }
        int asignadas = hija.getCantidad() != null ? hija.getCantidad() : 1;
        int aDevolver = dto != null && dto.getCantidad() != null && dto.getCantidad() > 0 ? dto.getCantidad() : asignadas;
        if (aDevolver > asignadas) {
            throw new IllegalArgumentException("La cantidad a devolver (" + aDevolver
                    + ") supera la asignada (" + asignadas + ")");
        }
        StockFicha lote = stockFichaRepository.findById(hija.getLoteOrigen());
        if (lote == null) {
            throw new IllegalArgumentException("Lote de origen no encontrado: " + hija.getLoteOrigen());
        }

        String codigoHija = hija.getCodigoInterno();
        String ultimoResponsable = hija.getResponsableNombre() != null && !hija.getResponsableNombre().isBlank()
                ? hija.getResponsableNombre()
                : (hija.getArea() != null && !hija.getArea().isBlank() ? "Área: " + hija.getArea() : "Soporte");
        String ultimaArea = hija.getArea() != null ? hija.getArea() : "";

        log.info("Stock Asignaciones: devolución a lote={} cantidad={} desde={} por actor={}",
                lote.getCodigoInterno(), aDevolver, codigoHija, actorUid);

        Timestamp now = Timestamp.now();
        int cantidadLote = lote.getCantidad() != null ? lote.getCantidad() : 0;
        lote.setCantidad(cantidadLote + aDevolver);
        lote.setUpdatedAt(now);
        stockFichaRepository.save(lote);

        int restante = asignadas - aDevolver;
        hija.setCantidad(restante);
        hija.setUpdatedAt(now);
        if (restante == 0) {
            hija.setEstado("DEVUELTA");
            hija.setResponsableNombre(null);
            hija.setResponsableId(null);
            hija.setArea(null);
        }
        stockFichaRepository.save(hija);

        if (restante == 0) {
            for (MovimientoStock m : movimientoStockRepository.findAll()) {
                if (codigoHija.equalsIgnoreCase(m.getCodigo())
                        && ("Activa".equalsIgnoreCase(m.getEstado()) || "Pendiente".equalsIgnoreCase(m.getEstado()))) {
                    movimientoStockRepository.update(m.getId(), Map.of(
                            "estado", "Finalizada",
                            "fecha_devolucion", ahora));
                }
            }
        }

        MovimientoStock devMov = new MovimientoStock();
        devMov.setId(UUID.randomUUID().toString());
        devMov.setCodigo(codigoHija);
        devMov.setFichaCodigo(codigoHija);
        devMov.setLoteOrigen(lote.getCodigoInterno());
        devMov.setCantidad(aDevolver);
        devMov.setTipo(normalizarTipoLabel(hija.getTipo()));
        devMov.setMarca(hija.getMarca());
        devMov.setModelo(hija.getModelo());
        devMov.setSerieOImei(hija.getSerieOImei());
        devMov.setResponsable(ultimoResponsable);
        devMov.setArea(ultimaArea);
        devMov.setAccion("Devolución");
        devMov.setEstado("Finalizada");
        devMov.setFecha(ahora);
        devMov.setFechaDevolucion(ahora);
        devMov.setMotivo(motivo);
        devMov.setActorUid(actorUid);
        devMov.setTipoMovimiento(com.bacarsa.inventario.models.TipoMovimiento.DEVOLUCION.name());
        devMov.setEstadoAnterior("Asignada");
        devMov.setEstadoNuevo("Sin Asignar");
        devMov.setDescripcionCompleta(hija.getDescripcion());
        devMov.setUbicacionOrigen(ultimaArea);
        devMov.setUbicacionDestino(lote.getUbicacion());
        movimientoStockRepository.save(devMov);
        return toDTO(devMov);
    }

    public List<MovimientoStockDTO> listarMovimientosPorCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) return List.of();
        String c = codigo.trim();
        try {
            List<MovimientoStock> persistidos = movimientoStockRepository.findAll();
            if (persistidos == null) return List.of();
            List<MovimientoStockDTO> filtrados = new ArrayList<>();
            String descFicha = null;
            try {
                FichaLectura fl = buscarFicha(c);
                if (fl != null && fl.getDescripcionCompleta() != null && !fl.getDescripcionCompleta().isBlank()) {
                    descFicha = fl.getDescripcionCompleta();
                }
            } catch (Exception ignored) {}

            for (MovimientoStock m : persistidos) {
                if (m != null && (c.equalsIgnoreCase(m.getFichaCodigo()) || c.equalsIgnoreCase(m.getCodigo())
                        || c.equalsIgnoreCase(m.getLoteOrigen()))) {
                    MovimientoStockDTO dto = toDTO(m);
                    if ((dto.getDescripcionCompleta() == null || dto.getDescripcionCompleta().isBlank()) && descFicha != null) {
                        dto.setDescripcionCompleta(descFicha);
                    }
                    filtrados.add(dto);
                }
            }
            filtrados.sort((a, b) -> {
                String fa = a.getFecha() != null ? a.getFecha() : "";
                String fb = b.getFecha() != null ? b.getFecha() : "";
                return fb.compareTo(fa);
            });
            return filtrados;
        } catch (Exception ex) {
            log.error("Stock Asignaciones: error al listar movimientos para codigo={}", codigo, ex);
            return List.of();
        }
    }

    private static boolean esMovimientoAsignacionActiva(MovimientoStock m) {
        String estado = m.getEstado() != null ? m.getEstado().trim() : "";
        if (!"Activa".equalsIgnoreCase(estado) && !"Pendiente".equalsIgnoreCase(estado)) {
            return false;
        }
        String tipoMov = m.getTipoMovimiento() != null ? m.getTipoMovimiento().trim().toUpperCase() : "";
        if ("BAJA".equals(tipoMov) || "REACTIVACION".equals(tipoMov) || "DEVOLUCION".equals(tipoMov)
                || "ALTA".equals(tipoMov) || "MODIFICACION".equals(tipoMov)) {
            return false;
        }
        String accion = m.getAccion() != null ? m.getAccion().trim().toLowerCase() : "";
        if (accion.contains("baja") || accion.contains("reactiv") || accion.contains("devol")
                || accion.equals("alta") || accion.contains("modific")) {
            return false;
        }
        return true;
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
                .cantidad(m.getCantidad())
                .loteOrigen(m.getLoteOrigen())
                .descripcionCompleta(m.getDescripcionCompleta() != null ? m.getDescripcionCompleta() : "")
                .build();
    }
}
