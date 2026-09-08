package com.bacarsa.inventario.services;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
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
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoConciliacion;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.OrigenAlta;
import com.bacarsa.inventario.models.TipoEquipo;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class ComputadoraService {

    private final ComputadoraRepository computadoraRepository;
    private final ResponsableService responsableService;

    public ComputadoraService(ComputadoraRepository computadoraRepository,
            ResponsableService responsableService) {
        this.computadoraRepository = computadoraRepository;
        this.responsableService = responsableService;
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

    public ComputadoraDTO crear(ComputadoraCreateDTO dto) throws ExecutionException, InterruptedException {
        if (dto.getHostname() == null || dto.getHostname().isBlank()) {
            throw new IllegalArgumentException("El hostname es obligatorio");
        }

        Computadora pc = new Computadora();
        pc.setUuid(UUID.randomUUID().toString());
        pc.setHostname(dto.getHostname().trim());
        pc.setUsuarioActual(blankToNull(dto.getUsuarioActual()));
        pc.setSistemaOperativo(blankToNull(dto.getSistemaOperativo()));
        pc.setArquitectura(blankToNull(dto.getArquitectura()));

        if (dto.getUbicacion() != null && !dto.getUbicacion().isBlank()) {
            try {
                pc.setUbicacion(Ubicacion.valueOf(dto.getUbicacion().trim()));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Ubicación inválida: " + dto.getUbicacion(), ex);
            }
        }

        String tipoEquipoRaw = blankToNull(dto.getTipoEquipo());
        if (tipoEquipoRaw != null) {
            TipoEquipo te = new TipoEquipo();
            te.setTipo(tipoEquipoRaw);
            pc.setTipoEquipo(te);
        }
        pc.setCondicion(blankToNull(dto.getCondicion()));
        pc.setOrigenAlta(OrigenAlta.STOCK);
        pc.setEstadoConciliacion(EstadoConciliacion.SIN_BASELINE);

        computadoraRepository.create(pc);

        String motivoAlta = (dto.getMotivo() != null && !dto.getMotivo().isBlank())
                ? dto.getMotivo().trim()
                : "Alta de equipo";
        CambiarEstadoDTO estadoDto = new CambiarEstadoDTO();
        estadoDto.setEstado("DERIVAR_ASIGNACION");
        estadoDto.setMotivo(motivoAlta);
        cambiarEstado(pc.getUuid(), estadoDto);

        return getByUuid(pc.getUuid());
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

    public ComputadoraDTO actualizarDatosStock(String uuid, ComputadoraStockUpdateDTO dto)
            throws ExecutionException, InterruptedException {
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }

        Ubicacion ubicacion = null;
        if (dto.getUbicacion() != null && !dto.getUbicacion().isBlank()) {
            try {
                ubicacion = Ubicacion.valueOf(dto.getUbicacion().trim());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Ubicación inválida: " + dto.getUbicacion(), ex);
            }
        }

        computadoraRepository.actualizarDatosStock(
                uuid,
                dto.getSistemaOperativo(),
                dto.getTipoEquipo(),
                dto.getCondicion(),
                ubicacion,
                dto.getUbicacionStock());
        return getByUuid(uuid);
    }

    public ComputadoraDTO ingresarStock(String uuid, IngresarStockDTO dto)
            throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }

        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();

        Ubicacion ubicacion = null;
        if (dto.getUbicacion() != null && !dto.getUbicacion().isBlank()) {
            try {
                ubicacion = Ubicacion.valueOf(dto.getUbicacion().trim());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Ubicación inválida: " + dto.getUbicacion(), ex);
            }
        }

        String motivo = blankToNull(dto.getMotivo());
        if (motivo == null) {
            motivo = "Ingreso a stock";
        }

        computadoraRepository.ingresarStock(uuid,
                dto.getSistemaOperativo(),
                dto.getTipoEquipo(),
                dto.getCondicion(),
                ubicacion,
                dto.getUbicacionStock(),
                motivo);

        ComputadoraDTO result = getByUuid(uuid);

        responsableService.sincronizarAsignacionPc(
                uuid, riAnterior,
                result != null ? result.getResponsableInventario() : null,
                hostname, ubicacionPc);

        return result;
    }

    public ComputadoraDTO actualizarUbicacion(String uuid, String ubicacionRaw)
            throws ExecutionException, InterruptedException {
        Ubicacion ubicacion;
        try {
            ubicacion = Ubicacion.valueOf(ubicacionRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación inválida: " + ubicacionRaw, ex);
        }
        if (computadoraRepository.findByUuid(uuid) == null) {
            return null;
        }
        computadoraRepository.updateUbicacion(uuid, ubicacion);
        return getByUuid(uuid);
    }

    public ComputadoraDTO cambiarEstado(String uuid, CambiarEstadoDTO dto)
            throws ExecutionException, InterruptedException {
        var pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }
        String trimmed = dto.getEstado() == null ? "" : dto.getEstado().trim();
        EstadoOperativo estadoOperativo;
        if ("DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            estadoOperativo = EstadoOperativo.inferirAsignacionDesdeTexto(pc.getResponsableInventario());
        } else {
            try {
                estadoOperativo = EstadoOperativo.valueOf(trimmed);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado inválido: " + dto.getEstado(), ex);
            }
        }

        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();

        String ubicacionStock = null;
        String responsableInventario = null;
        boolean limpiarResponsable = false;

        if (estadoOperativo == EstadoOperativo.SIN_ASIGNAR) {
            ubicacionStock = blankToNull(dto.getUbicacionStock());
            limpiarResponsable = true;
        }
        if (estadoOperativo == EstadoOperativo.ASIGNADA && dto.getResponsableInventario() != null) {
            responsableInventario = blankToNull(dto.getResponsableInventario());
        }

        Estado estado = new Estado();
        estado.setNombre(estadoOperativo.getNombre());
        estado.setDescripcion(estadoOperativo.getDescripcion());
        String riParaRepo = limpiarResponsable ? "" : responsableInventario;
        computadoraRepository.cambiarEstado(uuid, estado, dto.getMotivo(),
                ubicacionStock, riParaRepo);
        ComputadoraDTO result = getByUuid(uuid);
        if (!"DERIVAR_ASIGNACION".equalsIgnoreCase(trimmed)) {
            responsableService.sincronizarAsignacionPc(
                    uuid,
                    riAnterior,
                    result != null ? result.getResponsableInventario() : null,
                    hostname,
                    ubicacionPc);
        }
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

    public ComputadoraDTO actualizarResponsableInventario(String uuid, String nuevoRIRaw)
            throws ExecutionException, InterruptedException {
        Computadora pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }
        String riAnterior = pc.getResponsableInventario();
        String hostname = pc.getHostname();
        String ubicacionPc = pc.getUbicacion() == null ? null : pc.getUbicacion().name();
        String nuevoRI = blankToNull(nuevoRIRaw);
        computadoraRepository.actualizarResponsableInventario(uuid, nuevoRI);
        CambiarEstadoDTO dto = new CambiarEstadoDTO();
        dto.setEstado("DERIVAR_ASIGNACION");
        dto.setMotivo("Cambio de responsable de inventario a: " + nuevoRI);
        ComputadoraDTO result = cambiarEstado(uuid, dto);
        responsableService.sincronizarAsignacionPc(uuid, riAnterior, nuevoRI, hostname, ubicacionPc);
        return result;
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



