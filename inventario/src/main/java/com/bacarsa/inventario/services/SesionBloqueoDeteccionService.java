package com.bacarsa.inventario.services;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.repository.SesionBloqueoRepository;
import com.bacarsa.inventario.repository.SesionEstadoTrackerRepository;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Service
public class SesionBloqueoDeteccionService {

    private static final Logger log = LoggerFactory.getLogger(SesionBloqueoDeteccionService.class);
    private static final String ESTADO_BLOQUEADA = "bloqueada";

    private final Firestore firestore;
    private final String computadorasCollection;
    private final SesionBloqueoRepository sesionBloqueoRepository;
    private final SesionEstadoTrackerRepository trackerRepository;

    public SesionBloqueoDeteccionService(Firestore firestore,
            @Value("${firebase.collection.computadoras}") String computadorasCollection,
            SesionBloqueoRepository sesionBloqueoRepository,
            SesionEstadoTrackerRepository trackerRepository) {
        this.firestore = firestore;
        this.computadorasCollection = computadorasCollection;
        this.sesionBloqueoRepository = sesionBloqueoRepository;
        this.trackerRepository = trackerRepository;
    }

    /**
     * Compara sesion_estado actual vs. el último visto y registra transiciones a bloqueada.
     * @return cantidad de bloqueos registrados en esta pasada
     */
    public int detectarYRegistrarBloqueos() throws ExecutionException, InterruptedException {
        QuerySnapshot snap = firestore.collection(computadorasCollection).get().get();
        Map<String, String> estadosPrevios = trackerRepository.loadEstados();
        Map<String, String> estadosNuevos = new HashMap<>(estadosPrevios);
        int registrados = 0;

        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            String id = doc.getId();
            String estadoActual = doc.getString("sesion_estado");
            if (estadoActual == null || estadoActual.isBlank()) {
                continue;
            }

            String estadoAnterior = estadosPrevios.get(id);
            estadosNuevos.put(id, estadoActual);

            // Incluye primera lectura (estadoAnterior == null) para PCs ya bloqueadas al arrancar el tracker.
            if (ESTADO_BLOQUEADA.equals(estadoActual)
                    && !ESTADO_BLOQUEADA.equals(estadoAnterior)) {
                String hostname = doc.getString("hostname");
                String ubicacion = doc.getString("ubicacion");
                Long bloqueoMin = doc.getLong("sesion_bloqueo_auto_min");
                String anteriorRegistro = estadoAnterior != null ? estadoAnterior : "sin_datos";
                sesionBloqueoRepository.registrar(
                        id,
                        hostname,
                        ubicacion,
                        anteriorRegistro,
                        bloqueoMin != null ? bloqueoMin.intValue() : null);
                registrados++;
                log.info("Bloqueo registrado pc={} hostname={} desde={}",
                        id, hostname, estadoAnterior);
            }
        }

        trackerRepository.saveEstados(estadosNuevos);
        return registrados;
    }
}
