package com.bacarsa.inventario.services;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComputadoraCreateDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.mapper.ComputadoraMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.Estado;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.Ubicacion;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class ComputadoraService {

    private final ComputadoraRepository computadoraRepository;

    public ComputadoraService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public List<ComputadoraDTO> getAllComputadoras() throws ExecutionException, InterruptedException {
        return computadoraRepository.findAll().stream()
                .map(ComputadoraMapper::toListDTO)
                .collect(Collectors.toList());
    }

    public List<ComputadoraDTO> getRecientes(int limit) throws ExecutionException, InterruptedException {
        return computadoraRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        (Computadora c) -> c.getUltimaSincronizacion() != null
                                ? c.getUltimaSincronizacion().toDate().getTime() : 0L)
                        .reversed())
                .limit(limit)
                .map(ComputadoraMapper::toListDTO)
                .collect(Collectors.toList());
    }

    public List<ComputadoraDTO> listarComputadoras(String ubicacionRaw) throws ExecutionException, InterruptedException {
        if (ubicacionRaw == null || ubicacionRaw.isBlank()) {
            return getAllComputadoras();
        }
        Ubicacion ubicacion;
        try {
            ubicacion = Ubicacion.valueOf(ubicacionRaw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación inválida: " + ubicacionRaw, ex);
        }
        return computadoraRepository.findByUbicacion(ubicacion).stream()
                .map(ComputadoraMapper::toListDTO)
                .collect(Collectors.toList());
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
        return getByUuid(uuid);
    }

    public boolean eliminar(String uuid) throws ExecutionException, InterruptedException {
        return computadoraRepository.deleteByUuid(uuid);
    }

    public ComputadoraDTO actualizarResponsableInventario(String uuid, String nuevoRIRaw)
            throws ExecutionException, InterruptedException {
                if (computadoraRepository.findByUuid(uuid) == null) {
                    return null;
                }
                String nuevoRI = blankToNull(nuevoRIRaw);
                computadoraRepository.actualizarResponsableInventario(uuid, nuevoRI);
                CambiarEstadoDTO dto = new CambiarEstadoDTO();
                dto.setEstado("DERIVAR_ASIGNACION");
                dto.setMotivo("Cambio de responsable de inventario a: " + nuevoRI);
                return cambiarEstado(uuid, dto);
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



