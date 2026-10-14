package com.bacarsa.inventario.services;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.SesionBloqueoDTO;
import com.bacarsa.inventario.mapper.SesionBloqueoMapper;
import com.bacarsa.inventario.models.SesionBloqueo;
import com.bacarsa.inventario.repository.SesionBloqueoRepository;
import com.bacarsa.inventario.repository.SesionEstadoTrackerRepository;

@Service
public class SesionBloqueoService {

    private static final int LIMITE_DEFAULT = 500;
    private static final int LIMITE_MAX = 1000;

    private final SesionBloqueoRepository repository;
    private final SesionBloqueoDeteccionService deteccionService;
    private final SesionEstadoTrackerRepository trackerRepository;

    public SesionBloqueoService(SesionBloqueoRepository repository,
            SesionBloqueoDeteccionService deteccionService,
            SesionEstadoTrackerRepository trackerRepository) {
        this.repository = repository;
        this.deteccionService = deteccionService;
        this.trackerRepository = trackerRepository;
    }

    public List<SesionBloqueoDTO> listarRecientes(Integer limite)
            throws ExecutionException, InterruptedException {
        int n = limite == null ? LIMITE_DEFAULT : Math.min(Math.max(limite, 1), LIMITE_MAX);
        return repository.listarRecientes(n).stream()
                .map(SesionBloqueoMapper::toDTO)
                .toList();
    }

    /**
     * Reinicia el tracker y vuelve a detectar. Útil cuando el historial quedó vacío
     * porque las PCs ya estaban bloqueadas antes de que corriera el scheduler.
     */
    public int sincronizarInicial() throws ExecutionException, InterruptedException {
        trackerRepository.clearEstados();
        return deteccionService.detectarYRegistrarBloqueos();
    }

    public int detectarAhora() throws ExecutionException, InterruptedException {
        return deteccionService.detectarYRegistrarBloqueos();
    }
}
