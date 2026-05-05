package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ImpresoraAgrupadaDTO;
import com.bacarsa.inventario.dto.PcResumenImpresoraDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.PerifericosFirestore;
import com.bacarsa.inventario.repository.ComputadoraRepository;

@Service
public class ImpresoraService {

    private final ComputadoraRepository computadoraRepository;

    public ImpresoraService(ComputadoraRepository computadoraRepository) {
        this.computadoraRepository = computadoraRepository;
    }

    public List<ImpresoraAgrupadaDTO> listarAgrupadas() throws ExecutionException, InterruptedException {
        List<Computadora> computadoras = computadoraRepository.findAll();

        // clave → DTO en construcción
        Map<String, ImpresoraAgrupadaDTO> agrupadas = new LinkedHashMap<>();

        for (Computadora c : computadoras) {
            PerifericosFirestore p = c.getPerifericos();
            if (p == null || p.getImpresoras() == null) continue;

            for (ImpresoraFirestore imp : p.getImpresoras()) {
                if (!esImpresoraFisica(imp)) continue;

                String clave = normLower(imp.getNombre()) + "|"
                        + normLower(imp.getDriver()) + "|"
                        + normalizarPuerto(imp.getPuerto());

                ImpresoraAgrupadaDTO grupo = agrupadas.computeIfAbsent(clave, k -> {
                    ImpresoraAgrupadaDTO dto = new ImpresoraAgrupadaDTO();
                    dto.setNombre(imp.getNombre());
                    dto.setDriver(imp.getDriver());
                    dto.setPuerto(imp.getPuerto());
                    dto.setTipo(imp.getTipo());
                    dto.setTipoImpresora(imp.getTipoImpresora());
                    dto.setPcs(new ArrayList<>());
                    return dto;
                });

                PcResumenImpresoraDTO pc = new PcResumenImpresoraDTO();
                pc.setUuid(c.getUuid());
                pc.setHostname(c.getHostname());
                pc.setUbicacion(c.getUbicacion() != null ? c.getUbicacion().name() : null);
                pc.setPredeterminada(imp.getPredeterminada());
                pc.setCompartida(imp.getCompartida());
                grupo.getPcs().add(pc);
            }
        }

        List<ImpresoraAgrupadaDTO> resultado = new ArrayList<>(agrupadas.values());
        resultado.sort((a, b) -> normLower(a.getNombre()).compareTo(normLower(b.getNombre())));
        return resultado;
    }

    private static boolean esImpresoraFisica(ImpresoraFirestore p) {
        if (p == null) return false;
        String ti = normLower(p.getTipoImpresora());
        String t = normLower(p.getTipo());
        if (ti.contains("virtual") || t.contains("virtual")) return false;
        String nombre = normLower(p.getNombre());
        String driver = normLower(p.getDriver());
        String puerto = normLower(p.getPuerto());
        String blob = nombre + " " + driver + " " + puerto;
        if (blob.contains("anydesk") || puerto.contains("ad_port")) return false;
        if (nombre.contains("microsoft print to pdf")) return false;
        if (nombre.contains("microsoft xps document writer")) return false;
        if (nombre.contains("onenote") || nombre.contains("send to onenote")) return false;
        if (driver.contains("send to microsoft onenote")) return false;
        if (driver.contains("microsoft shared fax driver")) return false;
        if ("fax".equals(nombre) && driver.contains("fax")) return false;
        return true;
    }

    private static String normalizarPuerto(String puerto) {
        if (puerto == null) return "";
        String p = puerto.trim();
        if (p.toLowerCase().startsWith("ip_")) {
            p = p.substring(3);
        }
        p = p.replaceAll("(^|\\.)0+(\\d)", "$1$2");
        return p.toLowerCase();
    }

    private static String normLower(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}
