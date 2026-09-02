package com.bacarsa.inventario.services;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.EtiquetaQrDetalleDTO;
import com.bacarsa.inventario.dto.EtiquetaQrListadoDTO;
import com.bacarsa.inventario.mapper.EtiquetaQrMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.PerifericoManual;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.PerifericoManualRepository;

@Service
public class EtiquetaQrService {

    private final ComputadoraRepository computadoraRepository;
    private final PerifericoManualRepository perifericoManualRepository;

    public EtiquetaQrService(
            ComputadoraRepository computadoraRepository,
            PerifericoManualRepository perifericoManualRepository) {
        this.computadoraRepository = computadoraRepository;
        this.perifericoManualRepository = perifericoManualRepository;
    }

    public List<EtiquetaQrListadoDTO> listar() throws ExecutionException, InterruptedException {
        CompletableFuture<List<Computadora>> computadoras =
                enParalelo(computadoraRepository::findAll);
        CompletableFuture<Map<String, List<PerifericoManual>>> manuales =
                enParalelo(this::indexarManualesPorHostname);

        Map<String, List<PerifericoManual>> manualesPorHostname = manuales.get();
        return computadoras.get().stream()
                .map(pc -> EtiquetaQrMapper.toListado(pc, manualesDe(pc, manualesPorHostname)))
                .sorted(Comparator.comparing(
                        (EtiquetaQrListadoDTO d) -> d.getHostname() == null ? "" : d.getHostname().toLowerCase()))
                .collect(Collectors.toList());
    }

    public EtiquetaQrDetalleDTO obtenerPorUuid(String uuid) throws ExecutionException, InterruptedException {
        Computadora pc = computadoraRepository.findByUuid(uuid);
        if (pc == null) {
            return null;
        }
        return EtiquetaQrMapper.toDetalle(pc, manualesDe(pc));
    }

    public EtiquetaQrDetalleDTO obtenerPorHostname(String hostname) throws ExecutionException, InterruptedException {
        if (hostname == null || hostname.isBlank()) {
            return null;
        }
        Computadora pc = computadoraRepository.findByHostname(hostname.trim());
        if (pc == null) {
            return null;
        }
        return EtiquetaQrMapper.toDetalle(pc, manualesDe(pc));
    }

    public boolean existeUuid(String uuid) throws ExecutionException, InterruptedException {
        return computadoraRepository.findByUuid(uuid) != null;
    }

    private Map<String, List<PerifericoManual>> indexarManualesPorHostname()
            throws ExecutionException, InterruptedException {
        return perifericoManualRepository.findAll().stream()
                .filter(p -> p.getComputadoraHostname() != null && !p.getComputadoraHostname().isBlank())
                .collect(Collectors.groupingBy(p -> p.getComputadoraHostname().trim().toLowerCase()));
    }

    private static List<PerifericoManual> manualesDe(
            Computadora pc, Map<String, List<PerifericoManual>> porHostname) {
        if (pc == null || pc.getHostname() == null || pc.getHostname().isBlank()) {
            return List.of();
        }
        List<PerifericoManual> lista = porHostname.get(pc.getHostname().trim().toLowerCase());
        return lista == null ? List.of() : lista;
    }

    private List<PerifericoManual> manualesDe(Computadora pc)
            throws ExecutionException, InterruptedException {
        if (pc == null || pc.getHostname() == null || pc.getHostname().isBlank()) {
            return List.of();
        }
        return perifericoManualRepository.findByComputadoraHostname(pc.getHostname().trim());
    }

    private static <T> CompletableFuture<T> enParalelo(Consulta<T> consulta) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return consulta.obtener();
            } catch (ExecutionException | InterruptedException ex) {
                if (ex instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                throw new CompletionException(ex);
            }
        });
    }

    @FunctionalInterface
    private interface Consulta<T> {
        T obtener() throws ExecutionException, InterruptedException;
    }
}
