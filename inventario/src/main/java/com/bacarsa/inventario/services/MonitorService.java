package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.MonitorAgenteDTO;
import com.bacarsa.inventario.dto.MonitorReportadoAgenteDTO;
import com.bacarsa.inventario.mapper.PerifericosAgenteMapper;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class MonitorService {

    private final ComputadoraRepository computadoraRepository;

    public MonitorService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public List<MonitorReportadoAgenteDTO> listarReportadosAgente()
            throws ExecutionException, InterruptedException {
        List<Computadora> computadoras = computadoraRepository.findAll();
        List<MonitorReportadoAgenteDTO> salida = new ArrayList<>();

        for (Computadora c : computadoras) {
            // Excluir notebooks: sus pantallas integradas no son monitores del inventario
            if (c.getTipoEquipo() != null && Boolean.TRUE.equals(c.getTipoEquipo().getTieneBateria())) {
                continue;
            }
            PerifericosFirestore p = c.getPerifericos();
            if (p == null || p.getMonitores() == null) {
                continue;
            }
            String uuid = c.getUuid();
            String hostname = c.getHostname();
            for (MonitorFirestore mon : p.getMonitores()) {
                if (mon == null) {
                    continue;
                }
                MonitorAgenteDTO m = PerifericosAgenteMapper.toMonitorAgenteDTO(mon);
                if (m == null) {
                    continue;
                }
                MonitorReportadoAgenteDTO row = new MonitorReportadoAgenteDTO();
                row.setNombre(m.getNombre());
                row.setResolucion(m.getResolucion());
                row.setPulgadas(m.getPulgadas());
                row.setAnchoCm(m.getAnchoCm());
                row.setAltoCm(m.getAltoCm());
                row.setPcUuid(uuid);
                row.setPcHostname(hostname);
                salida.add(row);
            }
        }

        salida.sort(Comparator
                .comparing((MonitorReportadoAgenteDTO r) -> norm(r.getPcHostname()))
                .thenComparing(r -> norm(r.getNombre())));
        return salida;
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}
