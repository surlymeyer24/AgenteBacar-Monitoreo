package com.bacarsa.inventario.services;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComputadoraCreateDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.dto.ComputadoraStockUpdateDTO;
import com.bacarsa.inventario.dto.IngresarStockDTO;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.StockFicha;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.StockFichaRepository;
import com.bacarsa.inventario.util.UsuarioSesionHelper;
import com.google.cloud.Timestamp;

@Service
public class ComputadoraService {

    private static final Logger log = LoggerFactory.getLogger(ComputadoraService.class);

    private final ComputadoraRepository computadoraRepository;
    private final ResponsableService responsableService;
    private final ComputadoraHistorialService historialService;
    private final StockFichaRepository stockFichaRepository;

    public ComputadoraService(ComputadoraRepository computadoraRepository,
            ResponsableService responsableService,
            ComputadoraHistorialService historialService) {
        this(computadoraRepository, responsableService, historialService, null);
    }

    @Autowired
    public ComputadoraService(ComputadoraRepository computadoraRepository,
            ResponsableService responsableService,
            ComputadoraHistorialService historialService,
            @Autowired(required = false) StockFichaRepository stockFichaRepository) {
        this.computadoraRepository = computadoraRepository;
        this.responsableService = responsableService;
        this.historialService = historialService;
        this.stockFichaRepository = stockFichaRepository;
    }

    public List<ComputadoraListadoDTO> getAllComputadoras() throws ExecutionException, InterruptedException {
        return computadoraRepository.findAllListado();
    }

    public List<ComputadoraListadoDTO> getRecientes(int limit) throws ExecutionException, InterruptedException {
        return computadoraRepository.findAllListado().stream()
                .sorted(Comparator.comparing(
                        (ComputadoraListadoDTO d) -> d.getUltimaSincronizacion() != null
                                ? Instant.parse(d.getUltimaSincronizacion()) : Instant.EPOCH)
                        .reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<ComputadoraListadoDTO> listarComputadoras(String ubicacionRaw) throws ExecutionException, InterruptedException {
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            return getAllComputadoras();
        }
        Ubicacion ubicacion;
        try {
            ubicacion = Ubicacion.valueOf(ubicacionRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación inválida: " + ubicacionRaw, ex);
        }
        return computadoraRepository.findByUbicacionListado(ubicacion);
    }

    public ComputadoraDTO getByUuid(String uuid) throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            pc = computadoraRepository.findByCodigoInterno(uuid);
        }
        ComputadoraDTO dto = ComputadoraMapper.toDTO(pc);
        if (dto != null && pc != null) {
            dto.setProgramas(computadoraRepository.listProgramas(pc.getUuid()));
        }
        return dto;
    }

    public ComputadoraDTO crear(ComputadoraCreateDTO dto, String uid) throws ExecutionException, InterruptedException {
        if (dto.getHostname() == null || dto.getHostname().isBlank()) {
            throw new IllegalArgumentException("El hostname es obligatorio");
        }
        validarUbicacionSiViene(dto.getUbicacion());

        String uuid = UUID.randomUUID().toString();
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("hostname", dto.getHostname().trim());
        poner(cuerpo, "usuarioActual", dto.getUsuarioActual());
        poner(cuerpo, "ubicacion", dto.getUbicacion());
        poner(cuerpo, "sistemaOperativo", dto.getSistemaOperativo());
        poner(cuerpo, "arquitectura", dto.getArquitectura());
        poner(cuerpo, "tipoEquipo", dto.getTipoEquipo());
        poner(cuerpo, "condicion", dto.getCondicion());
        historialService.altaManual(uuid, cuerpo, dto.getMotivo(), uid);
        return getByUuid(uuid);
    }

    public ComputadoraDTO agregarImpresora(String uuid, ImpresoraFirestore impresora)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) return null;
        computadoraRepository.agregarImpresora(uuid, impresora);
        return getByUuid(uuid);
    }

    public ComputadoraDTO agregarMonitor(String uuid, MonitorFirestore monitor)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) return null;
        computadoraRepository.agregarMonitor(uuid, monitor);
        return getByUuid(uuid);
    }

    public ComputadoraDTO agregarDispositivoUsb(String uuid, DispositivoUsbFirestore usb)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) return null;
        computadoraRepository.agregarDispositivoUsb(uuid, usb);
        return getByUuid(uuid);
    }

    public ComputadoraDTO agregarAudioEntrada(String uuid, DispositivoAudioFirestore audio)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) return null;
        computadoraRepository.agregarAudioEntrada(uuid, audio);
        return getByUuid(uuid);
    }

    public ComputadoraDTO agregarAudioSalida(String uuid, DispositivoAudioFirestore audio)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) return null;
        computadoraRepository.agregarAudioSalida(uuid, audio);
        return getByUuid(uuid);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    public ComputadoraDTO actualizarDatosStock(String uuid, ComputadoraStockUpdateDTO dto, String uid)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }
        validarUbicacionSiViene(dto.getUbicacion());
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        if (dto.getSistemaOperativo() != null) {
            cuerpo.put("sistemaOperativo", dto.getSistemaOperativo());
        }
        if (dto.getTipoEquipo() != null) {
            cuerpo.put("tipoEquipo", dto.getTipoEquipo());
        }
        if (dto.getCondicion() != null) {
            cuerpo.put("condicion", dto.getCondicion());
        }
        if (dto.getUbicacion() != null) {
            cuerpo.put("ubicacion", dto.getUbicacion());
        }
        if (dto.getUbicacionStock() != null) {
            cuerpo.put("ubicacionStock", dto.getUbicacionStock());
        }
        if (dto.getNotas() != null) {
            cuerpo.put("notas", dto.getNotas());
        }
        if (dto.getComentarios() != null) {
            cuerpo.put("comentarios", dto.getComentarios());
        }
        historialService.editarFicha(uuid, cuerpo, uid);
        return getByUuid(uuid);
    }

    public ComputadoraDTO ingresarStock(String uuid, IngresarStockDTO dto, String uid)
            throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }

        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();

        String motivo = blankToNull(dto.getMotivo());
        if (motivo == null) {
            motivo = "Ingreso a stock";
        }
        validarUbicacionSiViene(dto.getUbicacion());

        Map<String, Object> ficha = new LinkedHashMap<>();
        if (dto.getSistemaOperativo() != null) {
            ficha.put("sistemaOperativo", dto.getSistemaOperativo());
        }
        if (dto.getTipoEquipo() != null) {
            ficha.put("tipoEquipo", dto.getTipoEquipo());
        }
        if (dto.getCondicion() != null) {
            ficha.put("condicion", dto.getCondicion());
        }
        if (dto.getUbicacion() != null) {
            ficha.put("ubicacion", dto.getUbicacion());
        }
        if (dto.getUbicacionStock() != null) {
            ficha.put("ubicacionStock", dto.getUbicacionStock());
        }
        ficha.put("en_deposito", true);
        String desc = ProyeccionStock.descripcionDesdeSpec(pc.getEspecificacionEsperada());
        if (desc != null && !desc.isBlank()) {
            ficha.put("descripcion_completa", desc);
        }
        String tipoEquipo = dto.getTipoEquipo() != null
                ? dto.getTipoEquipo()
                : (pc.getTipoEquipo() != null ? pc.getTipoEquipo().getTipo() : null);
        String codigoStock = resolverCodigoStock(pc, tipoEquipo);
        if (codigoStock != null && !codigoStock.equals(pc.getCodigoInterno())) {
            ficha.put("codigo_interno", codigoStock);
        }
        historialService.cambiarEstado(uuid, "SIN_ASIGNAR", motivo, ficha, uid);

        if (codigoStock != null) {
            String ubicacionDeposito = blankToNull(dto.getUbicacionStock()) != null
                    ? dto.getUbicacionStock().trim()
                    : (blankToNull(dto.getUbicacion()) != null ? dto.getUbicacion().trim() : null);
            String condicion = dto.getCondicion() != null ? dto.getCondicion() : pc.getCondicion();
            registrarFichaStockIngreso(uuid, pc, codigoStock, tipoEquipo, desc, ubicacionDeposito, condicion);
        }

        ComputadoraDTO result = getByUuid(uuid);

        responsableService.sincronizarAsignacionPc(
                uuid, riAnterior,
                result != null ? result.getResponsableInventario() : null,
                hostname, ubicacionPc);

        return result;
    }

    public ComputadoraDTO actualizarUbicacion(String uuid, String ubicacionRaw, String uid)
            throws ExecutionException, InterruptedException {
        validarUbicacionSiViene(ubicacionRaw);
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            throw new IllegalArgumentException("La ubicación es obligatoria");
        }
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }
        historialService.editarFicha(uuid, Map.of("ubicacion", ubicacionRaw.trim()), uid);
        return getByUuid(uuid);
    }

    public ComputadoraDTO editarFicha(String uuid, Map<String, Object> cuerpo, String uid)
            throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }
        if (cuerpo != null && cuerpo.containsKey("hostname")) {
            Object hostname = cuerpo.get("hostname");
            if (hostname == null || String.valueOf(hostname).isBlank()) {
                throw new IllegalArgumentException("El hostname es obligatorio");
            }
        }
        if (cuerpo != null && cuerpo.get("ubicacion") != null) {
            validarUbicacionSiViene(String.valueOf(cuerpo.get("ubicacion")));
        }
        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();
        sincronizarStockFicha(uuid, pc.getCodigoInterno(), cuerpo);

        String estadoActualNombre = pc.getEstadoActual() != null ? pc.getEstadoActual().getNombre() : null;
        boolean estadoBloqueado = esBajaOMantenimiento(estadoActualNombre);

        if (!estadoBloqueado) {
            String nuevoResp = cuerpo != null && cuerpo.containsKey("responsableInventario")
                    ? blankToNull(String.valueOf(cuerpo.get("responsableInventario")))
                    : pc.getResponsableInventario();
            String nuevaUbi = cuerpo != null && cuerpo.containsKey("ubicacion")
                    ? blankToNull(String.valueOf(cuerpo.get("ubicacion")))
                    : (pc.getUbicacion() != null ? pc.getUbicacion().name() : null);
            String tipoAsig = cuerpo != null && cuerpo.containsKey("asignacionTipo")
                    ? blankToNull(String.valueOf(cuerpo.get("asignacionTipo")))
                    : pc.getAsignacionTipo();
            String userActual = UsuarioSesionHelper.limpiar(pc.getUsuarioActual());
            boolean enDep = Boolean.TRUE.equals(pc.getEnDeposito());

            boolean tieneResp = nuevoResp != null && !nuevoResp.isBlank() && !UsuarioSesionHelper.esUsuarioSistema(nuevoResp);
            boolean ubicacionValida = nuevaUbi != null && !nuevaUbi.isBlank()
                    && !"DEPOSITO".equalsIgnoreCase(nuevaUbi.trim())
                    && !"STOCK".equalsIgnoreCase(nuevaUbi.trim())
                    && !enDep;
            boolean tieneUserSesionValido = userActual != null && !userActual.isBlank() && !UsuarioSesionHelper.esUsuarioSistema(userActual);

            boolean deberiaEstarAsignada = tieneResp
                    || ("AREA".equalsIgnoreCase(tipoAsig) && ubicacionValida)
                    || (ubicacionValida && (tieneResp || tieneUserSesionValido || tipoAsig == null || "AREA".equalsIgnoreCase(tipoAsig)));

            boolean esActualmenteAsignada = EstadoOperativo.ASIGNADA.getNombre().equalsIgnoreCase(estadoActualNombre);

            if (deberiaEstarAsignada && !esActualmenteAsignada) {
                historialService.cambiarEstado(uuid, "ASIGNADA", "Asignación automática por actualización de ficha", cuerpo, uid);
            } else if (!deberiaEstarAsignada && esActualmenteAsignada) {
                historialService.cambiarEstado(uuid, "SIN_ASIGNAR", "Pase a stock por actualización de ficha", cuerpo, uid);
            } else {
                historialService.editarFicha(uuid, cuerpo, uid);
            }
        } else {
            historialService.editarFicha(uuid, cuerpo, uid);
        }

        ComputadoraDTO result = getByUuid(uuid);
        if (cuerpo != null && cuerpo.containsKey("responsableInventario")) {
            responsableService.sincronizarAsignacionPc(
                    uuid,
                    riAnterior,
                    result != null ? result.getResponsableInventario() : null,
                    hostname,
                    ubicacionPc);
        }
        return result;
    }

    public ComputadoraDTO cambiarEstado(String uuid, CambiarEstadoDTO dto, String uid)
            throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }
        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();

        Map<String, Object> ficha = new LinkedHashMap<>();
        if (dto.getUbicacionStock() != null) {
            ficha.put("ubicacionStock", dto.getUbicacionStock());
        }
        if (dto.getResponsableInventario() != null) {
            ficha.put("responsableInventario", dto.getResponsableInventario());
        }
        historialService.cambiarEstado(uuid, dto.getEstado(), dto.getMotivo(), ficha, uid);
        ComputadoraDTO result = getByUuid(uuid);
        responsableService.sincronizarAsignacionPc(
                uuid,
                riAnterior,
                result != null ? result.getResponsableInventario() : null,
                hostname,
                ubicacionPc);
        return result;
    }

    public boolean eliminar(String uuid) throws ExecutionException, InterruptedException {
        Computadora pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return false;
        }
        String riAnterior = pc.getResponsableInventario();
        boolean ok = computadoraRepository.deleteByUuid(uuid);
        if (ok) {
            responsableService.quitarPcDeIndice(uuid, riAnterior);
        }
        return ok;
    }

    public ComputadoraDTO actualizarResponsableInventario(String uuid, String nuevoRIRaw, String uid)
            throws ExecutionException, InterruptedException {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("responsableInventario", nuevoRIRaw);
        return editarFicha(uuid, cuerpo, uid);
    }

    private static void validarUbicacionSiViene(String ubicacionRaw) {
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            return;
        }
        try {
            Ubicacion.valueOf(ubicacionRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación inválida: " + ubicacionRaw, ex);
        }
    }

    private static void poner(Map<String, Object> cuerpo, String clave, String valor) {
        if (valor != null && !valor.isBlank()) {
            cuerpo.put(clave, valor.trim());
        }
    }

    /**
     * Envía un comando a una PC por su UUID. Retorna false si la PC no existe.
     */
    public boolean enviarComando(String uuid, String comando) throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) {
            return false;
        }
        computadoraRepository.enviarComando(uuid, comando);
        return true;
    }

    /**
     * Código de stock para una PC que entra a depósito: el que ya tiene si es PC-N/NB-N;
     * si no, el siguiente libre. Devuelve null si no hay stock_fichas (sin fuente para numerar).
     */
    String resolverCodigoStock(Computadora pc, String tipoEquipo) {
        String actual = pc.getCodigoInterno();
        if (actual != null && !actual.isBlank()) {
            return actual.trim();
        }
        if (stockFichaRepository == null) {
            return null;
        }
        try {
            List<String> existentes = new java.util.ArrayList<>();
            for (StockFicha f : stockFichaRepository.findAll()) {
                if (f != null && f.getCodigoInterno() != null) {
                    existentes.add(f.getCodigoInterno());
                }
            }
            return CodigoStockPc.siguiente(CodigoStockPc.prefijo(tipoEquipo), existentes, candidato -> {
                try {
                    return computadoraRepository.findByCodigoInterno(candidato) != null;
                } catch (Exception ex) {
                    throw new IllegalStateException("No se pudo verificar el código " + candidato, ex);
                }
            });
        } catch (ExecutionException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("No se pudo calcular el código de stock para " + pc.getUuid(), ex);
        }
    }

    /**
     * Deja la ficha de stock de la PC en depósito bajo su código. Si existía una ficha
     * vieja con el uuid/hostname como código, pasa sus datos a la nueva y la marca REEMPLAZADA
     * (no se borra: hay movimientos que la referencian).
     */
    private void registrarFichaStockIngreso(String uuid, Computadora pc, String codigo, String tipoEquipo,
            String desc, String ubicacionDeposito, String condicion) {
        if (stockFichaRepository == null) {
            return;
        }
        try {
            String refOrigen = "computadoras/" + uuid;
            StockFicha vieja = null;
            for (StockFicha f : stockFichaRepository.findAll()) {
                if (f == null || codigo.equalsIgnoreCase(f.getCodigoInterno())
                        || "REEMPLAZADA".equalsIgnoreCase(f.getEstado())) {
                    continue;
                }
                if (uuid.equalsIgnoreCase(f.getCodigoInterno()) || refOrigen.equalsIgnoreCase(f.getRefOrigen())) {
                    vieja = f;
                    break;
                }
            }

            Timestamp ahora = Timestamp.now();
            StockFicha ficha = stockFichaRepository.findById(codigo);
            if (ficha == null) {
                String descripcion = desc != null && !desc.isBlank() ? desc
                        : (vieja != null && vieja.getDescripcion() != null && !vieja.getDescripcion().isBlank()
                                ? vieja.getDescripcion()
                                : pc.getHostname());
                ficha = StockFicha.builder()
                        .codigoInterno(codigo)
                        .tipo("NB".equals(CodigoStockPc.prefijo(tipoEquipo)) ? "NOTEBOOK" : "DESKTOP")
                        .descripcion(descripcion)
                        .marca(vieja != null && vieja.getMarca() != null ? vieja.getMarca() : "")
                        .modelo(vieja != null && vieja.getModelo() != null ? vieja.getModelo() : "")
                        .serieOImei(pc.getSerialEquipo() != null ? pc.getSerialEquipo() : "")
                        .refOrigen(refOrigen)
                        .cantidad(1)
                        .createdAt(vieja != null && vieja.getCreatedAt() != null ? vieja.getCreatedAt() : ahora)
                        .notas(vieja != null && vieja.getNotas() != null ? vieja.getNotas() : "")
                        .build();
            }
            ficha.setEstado("EN_DEPOSITO");
            ficha.setResponsableId(null);
            ficha.setResponsableNombre(null);
            ficha.setArea(null);
            ficha.setRefOrigen(refOrigen);
            ficha.setUbicacion(ubicacionDeposito != null ? ubicacionDeposito
                    : (ficha.getUbicacion() != null && !ficha.getUbicacion().isBlank() ? ficha.getUbicacion() : "Depósito Sistemas"));
            ficha.setCondicion(condicion != null && !condicion.isBlank() ? condicion.trim()
                    : (ficha.getCondicion() != null ? ficha.getCondicion() : "USADA"));
            ficha.setUpdatedAt(ahora);
            stockFichaRepository.save(ficha);

            if (vieja != null) {
                vieja.setEstado("REEMPLAZADA");
                vieja.setReemplazadaPor(codigo);
                vieja.setUpdatedAt(ahora);
                stockFichaRepository.save(vieja);
            }
        } catch (Exception ex) {
            log.warn("Stock Ficha: no se pudo registrar la ficha de stock {} para uuid={}: {}", codigo, uuid, ex.getMessage());
        }
    }

    private void sincronizarStockFicha(String uuid, String codigoInterno, Map<String, Object> cuerpo) {
        if (cuerpo == null || stockFichaRepository == null) return;
        try {
            StockFicha ficha = codigoInterno != null && !codigoInterno.isBlank()
                    ? stockFichaRepository.findById(codigoInterno)
                    : null;
            if (ficha == null || "REEMPLAZADA".equalsIgnoreCase(ficha.getEstado())) {
                ficha = stockFichaRepository.findById(uuid);
            }
            if (ficha != null && "REEMPLAZADA".equalsIgnoreCase(ficha.getEstado())) {
                ficha = null;
            }
            if (ficha == null) {
                // buscar por ref_origen
                for (StockFicha f : stockFichaRepository.findAll()) {
                    if (f != null && !"REEMPLAZADA".equalsIgnoreCase(f.getEstado())
                            && ("computadoras/" + uuid).equalsIgnoreCase(f.getRefOrigen())) {
                        ficha = f;
                        break;
                    }
                }
            }

            if (ficha != null) {
                if (cuerpo.containsKey("condicion") && cuerpo.get("condicion") != null) {
                    ficha.setCondicion(String.valueOf(cuerpo.get("condicion")).trim());
                }
                if (cuerpo.containsKey("ubicacion") && cuerpo.get("ubicacion") != null) {
                    ficha.setUbicacion(String.valueOf(cuerpo.get("ubicacion")).trim());
                }

                String asignacionTipo = null;
                if (cuerpo.containsKey("asignacionTipo") && cuerpo.get("asignacionTipo") != null) {
                    asignacionTipo = String.valueOf(cuerpo.get("asignacionTipo")).trim().toUpperCase();
                }

                if ("AREA".equals(asignacionTipo)) {
                    ficha.setEstado("ASIGNADA");
                    ficha.setResponsableNombre(null);
                    ficha.setResponsableId(null);
                    if (cuerpo.get("ubicacion") != null) {
                        ficha.setArea(String.valueOf(cuerpo.get("ubicacion")).trim());
                    }
                } else if ("PERSONA".equals(asignacionTipo)) {
                    ficha.setEstado("ASIGNADA");
                    Object ri = cuerpo.get("responsableInventario");
                    ficha.setResponsableNombre(ri != null ? String.valueOf(ri).trim() : null);
                }
                ficha.setUpdatedAt(Timestamp.now());
                stockFichaRepository.save(ficha);
            }
        } catch (Exception ex) {
            log.warn("Stock Ficha: no se pudo sincronizar ficha para uuid={}: {}", uuid, ex.getMessage());
        }
    }

    public int enviarComandoMasivo(List<String> uuids, String comando) throws ExecutionException, InterruptedException {
        return computadoraRepository.enviarComandoMasivo(uuids, comando);
    }
    private static boolean esBajaOMantenimiento(String estadoNombre) {
        if (estadoNombre == null || estadoNombre.isBlank()) {
            return false;
        }
        String u = estadoNombre.trim().toUpperCase(java.util.Locale.ROOT);
        return u.contains("BAJA") || u.contains("MANTENIMIENTO");
    }

}
