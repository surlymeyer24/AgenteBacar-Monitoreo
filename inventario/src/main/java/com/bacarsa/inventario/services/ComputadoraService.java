package com.bacarsa.inventario.services;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComputadoraCreateDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.dto.ComputadoraStockUpdateDTO;
import com.bacarsa.inventario.dto.IngresarStockDTO;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class ComputadoraService {

    private final ComputadoraRepository computadoraRepository;
    private final ResponsableService responsableService;
    private final ComputadoraHistorialService historialService;

    public ComputadoraService(ComputadoraRepository computadoraRepository,
            ResponsableService responsableService,
            ComputadoraHistorialService historialService) {
        this.computadoraRepository = computadoraRepository;
        this.responsableService = responsableService;
        this.historialService = historialService;
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
        ComputadoraDTO dto = ComputadoraMapper.toDTO(pc);
        if (dto != null) {
            dto.setProgramas(computadoraRepository.listProgramas(uuid));
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
        historialService.cambiarEstado(uuid, "SIN_ASIGNAR", motivo, ficha, uid);

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
        historialService.editarFicha(uuid, cuerpo, uid);
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
     * Envía un comando a múltiples PCs. No valida existencia individual — mismo comportamiento
     * que el batch original del front. Retorna la cantidad de documentos escritos.
     */
    public int enviarComandoMasivo(List<String> uuids, String comando) throws ExecutionException, InterruptedException {
        return computadoraRepository.enviarComandoMasivo(uuids, comando);
    }
}



