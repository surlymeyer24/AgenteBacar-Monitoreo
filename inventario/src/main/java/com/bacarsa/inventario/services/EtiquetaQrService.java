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
        CompletableFuture<IndiceManualesPc> manuales =
                enParalelo(this::indexarManualesPorPc);

        IndiceManualesPc indice = manuales.get();
        return computadoras.get().stream()
                .map(pc -> EtiquetaQrMapper.toListado(pc, manualesDe(pc, indice)))
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

    private record IndiceManualesPc(
            Map<String, List<PerifericoManual>> porUuid,
            Map<String, List<PerifericoManual>> porHostname) {}

    private IndiceManualesPc indexarManualesPorPc()
            throws ExecutionException, InterruptedException {
        Map<String, List<PerifericoManual>> porUuid = new java.util.HashMap<>();
        Map<String, List<PerifericoManual>> porHostname = new java.util.HashMap<>();
        for (PerifericoManual p : perifericoManualRepository.findAll()) {
            if (p.getComputadoraUuid() != null && !p.getComputadoraUuid().isBlank()) {
                porUuid.computeIfAbsent(p.getComputadoraUuid().trim(), k -> new java.util.ArrayList<>()).add(p);
            }
            if (p.getComputadoraHostname() != null && !p.getComputadoraHostname().isBlank()) {
                porHostname.computeIfAbsent(p.getComputadoraHostname().trim().toLowerCase(), k -> new java.util.ArrayList<>()).add(p);
            }
        }
        return new IndiceManualesPc(porUuid, porHostname);
    }

    private static List<PerifericoManual> manualesDe(Computadora pc, IndiceManualesPc indice) {
        if (pc == null) {
            return List.of();
        }
        if (pc.getUuid() != null && !pc.getUuid().isBlank()) {
            List<PerifericoManual> porUuid = indice.porUuid().get(pc.getUuid().trim());
            if (porUuid != null && !porUuid.isEmpty()) {
                return porUuid;
            }
        }
        if (pc.getHostname() == null || pc.getHostname().isBlank()) {
            return List.of();
        }
        List<PerifericoManual> porHostname = indice.porHostname().get(pc.getHostname().trim().toLowerCase());
        return porHostname == null ? List.of() : porHostname;
    }

    private List<PerifericoManual> manualesDe(Computadora pc)
            throws ExecutionException, InterruptedException {
        if (pc == null) {
            return List.of();
        }
        if (pc.getUuid() != null && !pc.getUuid().isBlank()) {
            List<PerifericoManual> porUuid = perifericoManualRepository.findByComputadoraUuid(pc.getUuid());
            if (!porUuid.isEmpty()) {
                return porUuid;
            }
        }
        if (pc.getHostname() == null || pc.getHostname().isBlank()) {
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
