package com.bacarsa.inventario.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.InfraestructuraDuplicadoItemDTO;
import com.bacarsa.inventario.dto.LimpiezaDuplicadosInfraResultDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;

@Service
public class InfraestructuraLimpiezaService {

    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;

    public InfraestructuraLimpiezaService(
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository) {
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
    }

    public List<InfraestructuraDuplicadoItemDTO> detectarDuplicados()
            throws ExecutionException, InterruptedException {
        return planificarLimpieza(
                routerRepository.findAll(),
                switchRedRepository.findAll(),
                accessPointRepository.findAll());
    }

    public LimpiezaDuplicadosInfraResultDTO limpiarDuplicados()
            throws ExecutionException, InterruptedException {
        List<Router> routers = routerRepository.findAll();
        List<SwitchRed> switches = switchRedRepository.findAll();
        List<AccessPoint> aps = accessPointRepository.findAll();

        List<InfraestructuraDuplicadoItemDTO> plan = planificarLimpieza(routers, switches, aps);
        LimpiezaDuplicadosInfraResultDTO result = new LimpiezaDuplicadosInfraResultDTO();

        for (InfraestructuraDuplicadoItemDTO item : plan) {
            switch (item.getTipo()) {
                case "router" -> routerRepository.deleteById(item.getId());
                case "switch" -> switchRedRepository.deleteById(item.getId());
                case "access-point" -> accessPointRepository.deleteById(item.getId());
                default -> throw new IllegalStateException("Tipo desconocido: " + item.getTipo());
            }
            result.getDetalle().add(item);
        }

        result.setEliminados(result.getDetalle().size());
        return result;
    }

    /**
     * Tras una migración exitosa, elimina switches huérfanos creados por intentos fallidos
     * (mismo nombre/IP que el AP conservado, distinto ID).
     */
    public void eliminarSwitchesHuerfanosDeMigracion(String apIdConservado, String nombre, String ip)
            throws ExecutionException, InterruptedException {
        if (nombre == null || nombre.isBlank()) {
            return;
        }
        String clave = claveNombreIp(nombre, ip);
        for (SwitchRed sw : switchRedRepository.findAll()) {
            if (sw.getId().equals(apIdConservado)) {
                continue;
            }
            if (!clave.equals(claveNombreIp(sw.getNombre(), sw.getIp()))) {
                continue;
            }
            switchRedRepository.deleteById(sw.getId());
        }
        eliminarApsDuplicadosDeMigracion(apIdConservado, nombre, ip);
    }

    /**
     * Elimina access points duplicados (mismo nombre/IP) distintos del conservado.
     */
    public void eliminarApsDuplicadosDeMigracion(String apIdConservado, String nombre, String ip)
            throws ExecutionException, InterruptedException {
        String clave = claveDuplicadoEquipo(nombre, ip);
        if (clave.isBlank()) {
            return;
        }
        for (AccessPoint ap : accessPointRepository.findAll()) {
            if (ap.getId().equals(apIdConservado)) {
                continue;
            }
            if (!clave.equals(claveDuplicadoEquipo(ap.getNombre(), ap.getIp()))) {
                continue;
            }
            accessPointRepository.deleteById(ap.getId());
        }
    }

    public void eliminarRoutersDuplicadosDeMigracion(String routerIdConservado, String nombre, String ip)
            throws ExecutionException, InterruptedException {
        String clave = claveDuplicadoEquipo(nombre, ip);
        if (clave.isBlank()) {
            return;
        }
        for (Router r : routerRepository.findAll()) {
            if (r.getId().equals(routerIdConservado)) {
                continue;
            }
            if (!clave.equals(claveDuplicadoEquipo(r.getNombre(), r.getIp()))) {
                continue;
            }
            routerRepository.deleteById(r.getId());
        }
    }

    private List<InfraestructuraDuplicadoItemDTO> planificarLimpieza(
            List<Router> routers,
            List<SwitchRed> switches,
            List<AccessPoint> aps) {

        List<InfraestructuraDuplicadoItemDTO> plan = new ArrayList<>();
        Set<String> yaPlanificado = new HashSet<>();

        Set<String> routerIds = new HashSet<>();
        for (Router r : routers) {
            routerIds.add(r.getId());
        }

        Set<String> switchIds = new HashSet<>();
        for (SwitchRed sw : switches) {
            switchIds.add(sw.getId());
        }

        Set<String> apIds = new HashSet<>();
        for (AccessPoint ap : aps) {
            apIds.add(ap.getId());
        }

        // Mismo ID en varias colecciones: conservar access-point > switch > router
        for (String id : apIds) {
            if (switchIds.contains(id)) {
                agregar(plan, yaPlanificado, itemSwitch(id, switches, "Mismo ID en switch y access point", "access-point", id));
            }
            if (routerIds.contains(id)) {
                agregar(plan, yaPlanificado, itemRouter(id, routers, "Mismo ID en router y access point", "access-point", id));
            }
        }

        for (String id : switchIds) {
            if (routerIds.contains(id) && !apIds.contains(id)) {
                agregar(plan, yaPlanificado, itemRouter(id, routers, "Mismo ID en router y switch", "switch", id));
            }
        }

        // Switch duplicado por nombre+IP cuando ya existe un AP (migración fallida con ID nuevo)
        for (SwitchRed sw : switches) {
            String clave = claveNombreIp(sw.getNombre(), sw.getIp());
            if (clave.isBlank()) {
                continue;
            }
            AccessPoint apMatch = buscarApPorClave(aps, clave);
            if (apMatch == null) {
                continue;
            }
            if (sw.getId().equals(apMatch.getId())) {
                continue;
            }
            String key = "switch:" + sw.getId();
            if (yaPlanificado.contains(key)) {
                continue;
            }
            InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
            item.setId(sw.getId());
            item.setTipo("switch");
            item.setNombre(sw.getNombre());
            item.setIp(sw.getIp());
            item.setMotivo("Switch duplicado de access point \"" + apMatch.getNombre() + "\" (mismo nombre/IP)");
            item.setConservarTipo("access-point");
            item.setConservarId(apMatch.getId());
            agregar(plan, yaPlanificado, item);
        }

        plan.addAll(planificarApsDuplicados(aps, switchIds, routerIds, yaPlanificado));
        plan.addAll(planificarRoutersDuplicados(routers, switchIds, apIds, yaPlanificado));
        plan.addAll(planificarSwitchesDuplicados(switches, apIds, yaPlanificado));
        plan.addAll(planificarRoutersCruzados(routers, switches, aps, yaPlanificado));

        return plan;
    }

    private List<InfraestructuraDuplicadoItemDTO> planificarApsDuplicados(
            List<AccessPoint> aps,
            Set<String> switchIds,
            Set<String> routerIds,
            Set<String> yaPlanificado) {

        Map<String, List<AccessPoint>> grupos = new HashMap<>();
        for (AccessPoint ap : aps) {
            String clave = claveDuplicadoEquipo(ap.getNombre(), ap.getIp());
            if (clave.isBlank()) {
                continue;
            }
            grupos.computeIfAbsent(clave, k -> new ArrayList<>()).add(ap);
        }

        List<InfraestructuraDuplicadoItemDTO> plan = new ArrayList<>();
        for (List<AccessPoint> grupo : grupos.values()) {
            if (grupo.size() < 2) {
                continue;
            }
            AccessPoint conservar = elegirApAConservar(grupo, switchIds, routerIds);
            for (AccessPoint ap : grupo) {
                if (ap.getId().equals(conservar.getId())) {
                    continue;
                }
                InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
                item.setId(ap.getId());
                item.setTipo("access-point");
                item.setNombre(ap.getNombre());
                item.setIp(ap.getIp());
                item.setMotivo("Access point duplicado de \"" + conservar.getNombre() + "\" (mismo nombre/IP)");
                item.setConservarTipo("access-point");
                item.setConservarId(conservar.getId());
                agregar(plan, yaPlanificado, item);
            }
        }
        return plan;
    }

    private List<InfraestructuraDuplicadoItemDTO> planificarRoutersDuplicados(
            List<Router> routers,
            Set<String> switchIds,
            Set<String> apIds,
            Set<String> yaPlanificado) {

        Map<String, List<Router>> grupos = new HashMap<>();
        for (Router r : routers) {
            String clave = claveDuplicadoEquipo(r.getNombre(), r.getIp());
            if (clave.isBlank()) {
                continue;
            }
            grupos.computeIfAbsent(clave, k -> new ArrayList<>()).add(r);
        }

        List<InfraestructuraDuplicadoItemDTO> plan = new ArrayList<>();
        for (List<Router> grupo : grupos.values()) {
            if (grupo.size() < 2) {
                continue;
            }
            Router conservar = elegirRouterAConservar(grupo, switchIds, apIds);
            for (Router r : grupo) {
                if (r.getId().equals(conservar.getId())) {
                    continue;
                }
                InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
                item.setId(r.getId());
                item.setTipo("router");
                item.setNombre(r.getNombre());
                item.setIp(r.getIp());
                item.setMotivo("Router duplicado de \"" + conservar.getNombre() + "\" (mismo nombre/IP)");
                item.setConservarTipo("router");
                item.setConservarId(conservar.getId());
                agregar(plan, yaPlanificado, item);
            }
        }
        return plan;
    }

    private List<InfraestructuraDuplicadoItemDTO> planificarSwitchesDuplicados(
            List<SwitchRed> switches,
            Set<String> apIds,
            Set<String> yaPlanificado) {

        Map<String, List<SwitchRed>> grupos = new HashMap<>();
        for (SwitchRed sw : switches) {
            String clave = claveDuplicadoEquipo(sw.getNombre(), sw.getIp());
            if (clave.isBlank()) {
                continue;
            }
            grupos.computeIfAbsent(clave, k -> new ArrayList<>()).add(sw);
        }

        List<InfraestructuraDuplicadoItemDTO> plan = new ArrayList<>();
        for (List<SwitchRed> grupo : grupos.values()) {
            if (grupo.size() < 2) {
                continue;
            }
            SwitchRed conservar = elegirSwitchAConservar(grupo, apIds);
            for (SwitchRed sw : grupo) {
                if (sw.getId().equals(conservar.getId())) {
                    continue;
                }
                InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
                item.setId(sw.getId());
                item.setTipo("switch");
                item.setNombre(sw.getNombre());
                item.setIp(sw.getIp());
                item.setMotivo("Switch duplicado de \"" + conservar.getNombre() + "\" (mismo nombre/IP)");
                item.setConservarTipo("switch");
                item.setConservarId(conservar.getId());
                agregar(plan, yaPlanificado, item);
            }
        }
        return plan;
    }

    /** Router con mismo nombre/IP que un switch o AP (IDs distintos): se elimina el router. */
    private List<InfraestructuraDuplicadoItemDTO> planificarRoutersCruzados(
            List<Router> routers,
            List<SwitchRed> switches,
            List<AccessPoint> aps,
            Set<String> yaPlanificado) {

        List<InfraestructuraDuplicadoItemDTO> plan = new ArrayList<>();
        for (Router r : routers) {
            String clave = claveNombreIp(r.getNombre(), r.getIp());
            if (clave.isBlank()) {
                continue;
            }
            AccessPoint apMatch = buscarApPorClave(aps, clave);
            if (apMatch != null && !apMatch.getId().equals(r.getId())) {
                agregar(plan, yaPlanificado, itemRouter(
                        r.getId(), routers,
                        "Router duplicado de access point \"" + apMatch.getNombre() + "\" (mismo nombre/IP)",
                        "access-point", apMatch.getId()));
                continue;
            }
            SwitchRed swMatch = buscarSwitchPorClave(switches, clave);
            if (swMatch != null && !swMatch.getId().equals(r.getId())) {
                agregar(plan, yaPlanificado, itemRouter(
                        r.getId(), routers,
                        "Router duplicado de switch \"" + swMatch.getNombre() + "\" (mismo nombre/IP)",
                        "switch", swMatch.getId()));
            }
        }
        return plan;
    }

    private static Router elegirRouterAConservar(
            List<Router> grupo, Set<String> switchIds, Set<String> apIds) {
        return grupo.stream()
                .sorted(Comparator
                        .comparingInt((Router r) -> puntajeConservarRouter(r, switchIds, apIds))
                        .reversed()
                        .thenComparing(Router::getId))
                .findFirst()
                .orElse(grupo.get(0));
    }

    private static SwitchRed elegirSwitchAConservar(List<SwitchRed> grupo, Set<String> apIds) {
        return grupo.stream()
                .sorted(Comparator
                        .comparingInt((SwitchRed sw) -> apIds.contains(sw.getId()) ? 100 : 0)
                        .reversed()
                        .thenComparing(sw -> sw.getModelo() != null && !sw.getModelo().isBlank() ? 1 : 0)
                        .reversed()
                        .thenComparing(SwitchRed::getId))
                .findFirst()
                .orElse(grupo.get(0));
    }

    private static int puntajeConservarRouter(Router r, Set<String> switchIds, Set<String> apIds) {
        int score = 0;
        if (switchIds.contains(r.getId())) {
            score += 100;
        }
        if (apIds.contains(r.getId())) {
            score += 80;
        }
        if (r.getNumeroSerie() != null && !r.getNumeroSerie().isBlank()) {
            score += 10;
        }
        if (r.getModelo() != null && !r.getModelo().isBlank()) {
            score += 5;
        }
        if (r.getIp() != null && !r.getIp().isBlank()) {
            score += 3;
        }
        if (r.getGateway() != null && !r.getGateway().isBlank()) {
            score += 2;
        }
        return score;
    }

    private static SwitchRed buscarSwitchPorClave(List<SwitchRed> switches, String clave) {
        for (SwitchRed sw : switches) {
            if (clave.equals(claveNombreIp(sw.getNombre(), sw.getIp()))) {
                return sw;
            }
        }
        return null;
    }

    private static AccessPoint elegirApAConservar(
            List<AccessPoint> grupo, Set<String> switchIds, Set<String> routerIds) {
        return grupo.stream()
                .sorted(Comparator
                        .comparingInt((AccessPoint ap) -> puntajeConservarAp(ap, switchIds, routerIds))
                        .reversed()
                        .thenComparing(AccessPoint::getId))
                .findFirst()
                .orElse(grupo.get(0));
    }

    private static int puntajeConservarAp(AccessPoint ap, Set<String> switchIds, Set<String> routerIds) {
        int score = 0;
        if (switchIds.contains(ap.getId())) {
            score += 100;
        }
        if (routerIds.contains(ap.getId())) {
            score += 50;
        }
        if (ap.getMac() != null && !ap.getMac().isBlank()) {
            score += 10;
        }
        if (ap.getModelo() != null && !ap.getModelo().isBlank()) {
            score += 5;
        }
        if (ap.getIp() != null && !ap.getIp().isBlank()) {
            score += 3;
        }
        return score;
    }

    private static AccessPoint buscarApPorClave(List<AccessPoint> aps, String clave) {
        for (AccessPoint ap : aps) {
            if (clave.equals(claveNombreIp(ap.getNombre(), ap.getIp()))) {
                return ap;
            }
        }
        return null;
    }

    private static InfraestructuraDuplicadoItemDTO itemSwitch(
            String id, List<SwitchRed> switches, String motivo, String conservarTipo, String conservarId) {
        SwitchRed sw = switches.stream().filter(s -> id.equals(s.getId())).findFirst().orElse(null);
        InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
        item.setId(id);
        item.setTipo("switch");
        item.setNombre(sw != null ? sw.getNombre() : id);
        item.setIp(sw != null ? sw.getIp() : null);
        item.setMotivo(motivo);
        item.setConservarTipo(conservarTipo);
        item.setConservarId(conservarId);
        return item;
    }

    private static InfraestructuraDuplicadoItemDTO itemRouter(
            String id, List<Router> routers, String motivo, String conservarTipo, String conservarId) {
        Router r = routers.stream().filter(x -> id.equals(x.getId())).findFirst().orElse(null);
        InfraestructuraDuplicadoItemDTO item = new InfraestructuraDuplicadoItemDTO();
        item.setId(id);
        item.setTipo("router");
        item.setNombre(r != null ? r.getNombre() : id);
        item.setIp(r != null ? r.getIp() : null);
        item.setMotivo(motivo);
        item.setConservarTipo(conservarTipo);
        item.setConservarId(conservarId);
        return item;
    }

    private static void agregar(
            List<InfraestructuraDuplicadoItemDTO> plan,
            Set<String> yaPlanificado,
            InfraestructuraDuplicadoItemDTO item) {
        String key = item.getTipo() + ":" + item.getId();
        if (yaPlanificado.add(key)) {
            plan.add(item);
        }
    }

    static String claveNombreIp(String nombre, String ip) {
        String n = nombre == null ? "" : nombre.trim().toLowerCase();
        if (n.isEmpty()) {
            return "";
        }
        String i = ip == null ? "" : ip.trim().toLowerCase();
        return n + "|" + i;
    }

    /** Clave para agrupar equipos duplicados: nombre+IP si hay IP; si no, solo nombre. */
    static String claveDuplicadoEquipo(String nombre, String ip) {
        String n = nombre == null ? "" : nombre.trim().toLowerCase();
        if (n.isEmpty()) {
            return "";
        }
        String i = ip == null ? "" : ip.trim().toLowerCase();
        if (!i.isEmpty()) {
            return "nip|" + n + "|" + i;
        }
        return "nom|" + n;
    }

    static String claveDuplicadoAp(String nombre, String ip) {
        return claveDuplicadoEquipo(nombre, ip);
    }
}
