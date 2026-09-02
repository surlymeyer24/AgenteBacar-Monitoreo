package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AudioPerifericoConOrigenDTO;
import com.bacarsa.inventario.dto.DispositivoAudioAgenteDTO;
import com.bacarsa.inventario.dto.DispositivoUsbAgenteDTO;
import com.bacarsa.inventario.dto.PerifericosAgenteListadosDTO;
import com.bacarsa.inventario.dto.UsbPerifericoConOrigenDTO;
import com.bacarsa.inventario.mapper.PerifericosAgenteMapper;
import com.bacarsa.inventario.models.AudioFirestore;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.util.PerifericosAgenteHeuristica;

@Service
public class PerifericosAgenteListadoService {

    private final ComputadoraRepository computadoraRepository;

    public PerifericosAgenteListadoService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public PerifericosAgenteListadosDTO listados() throws ExecutionException, InterruptedException {
        List<UsbPerifericoConOrigenDTO> teclados = new ArrayList<>();
        List<UsbPerifericoConOrigenDTO> mouse = new ArrayList<>();
        List<UsbPerifericoConOrigenDTO> webcams = new ArrayList<>();
        List<AudioPerifericoConOrigenDTO> parlantes = new ArrayList<>();
        List<AudioPerifericoConOrigenDTO> microfonos = new ArrayList<>();

        List<Computadora> computadoras = computadoraRepository.findAll();
        for (Computadora c : computadoras) {
            String uuid = c.getUuid();
            String hostname = c.getHostname();
            PerifericosFirestore p = c.getPerifericos();
            if (p == null) {
                continue;
            }

            if (p.getDispositivosUsb() != null) {
                for (DispositivoUsbFirestore raw : p.getDispositivosUsb()) {
                    if (raw == null) {
                        continue;
                    }
                    DispositivoUsbAgenteDTO u = PerifericosAgenteMapper.toDispositivoUsbAgenteDTO(raw);
                    if (u == null) {
                        continue;
                    }
                    if (PerifericosAgenteHeuristica.esTeclado(raw)) {
                        teclados.add(usbConOrigen(u, uuid, hostname));
                    }
                    if (PerifericosAgenteHeuristica.esMouse(raw)) {
                        mouse.add(usbConOrigen(u, uuid, hostname));
                    }
                    if (PerifericosAgenteHeuristica.esWebcamClaseCamera(raw)) {
                        webcams.add(usbConOrigen(u, uuid, hostname));
                    }
                }
            }

            AudioFirestore audio = p.getAudio();
            if (audio != null) {
                if (audio.getSalida() != null) {
                    for (DispositivoAudioFirestore raw : audio.getSalida()) {
                        DispositivoAudioAgenteDTO a = PerifericosAgenteMapper.toDispositivoAudioAgenteDTO(raw);
                        if (a != null) {
                            parlantes.add(audioConOrigen(a, uuid, hostname));
                        }
                    }
                }
                if (audio.getEntrada() != null) {
                    for (DispositivoAudioFirestore raw : audio.getEntrada()) {
                        DispositivoAudioAgenteDTO a = PerifericosAgenteMapper.toDispositivoAudioAgenteDTO(raw);
                        if (a != null) {
                            microfonos.add(audioConOrigen(a, uuid, hostname));
                        }
                    }
                }
            }
        }

        Comparator<UsbPerifericoConOrigenDTO> cmpUsb = Comparator
                .comparing((UsbPerifericoConOrigenDTO r) -> norm(r.getPcHostname()))
                .thenComparing(r -> norm(r.getNombre()));
        teclados.sort(cmpUsb);
        mouse.sort(cmpUsb);
        webcams.sort(cmpUsb);

        Comparator<AudioPerifericoConOrigenDTO> cmpAudio = Comparator
                .comparing((AudioPerifericoConOrigenDTO r) -> norm(r.getPcHostname()))
                .thenComparing(r -> norm(r.getNombre()));
        parlantes.sort(cmpAudio);
        microfonos.sort(cmpAudio);

        return new PerifericosAgenteListadosDTO(teclados, mouse, webcams, parlantes, microfonos);
    }

    private static UsbPerifericoConOrigenDTO usbConOrigen(
            DispositivoUsbAgenteDTO u, String pcUuid, String pcHostname) {
        UsbPerifericoConOrigenDTO row = new UsbPerifericoConOrigenDTO();
        row.setNombre(u.getNombre());
        row.setFabricante(u.getFabricante());
        row.setCategoria(u.getCategoria());
        row.setClase(u.getClase());
        row.setConexion(u.getConexion());
        row.setVid(u.getVid());
        row.setPid(u.getPid());
        row.setPcUuid(pcUuid);
        row.setPcHostname(pcHostname);
        return row;
    }

    private static AudioPerifericoConOrigenDTO audioConOrigen(
            DispositivoAudioAgenteDTO a, String pcUuid, String pcHostname) {
        AudioPerifericoConOrigenDTO row = new AudioPerifericoConOrigenDTO();
        row.setNombre(a.getNombre());
        row.setFabricante(a.getFabricante());
        row.setEstado(a.getEstado());
        row.setPcUuid(pcUuid);
        row.setPcHostname(pcHostname);
        return row;
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}
