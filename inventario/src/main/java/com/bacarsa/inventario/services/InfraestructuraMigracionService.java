package com.bacarsa.inventario.services;

import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.AccessPointCreateDTO;
import com.bacarsa.inventario.dto.AccessPointDTO;
import com.bacarsa.inventario.dto.CambiarTipoInfraRequest;
import com.bacarsa.inventario.dto.RouterCreateDTO;
import com.bacarsa.inventario.dto.RouterDTO;
import com.bacarsa.inventario.dto.SwitchRedCreateDTO;
import com.bacarsa.inventario.dto.SwitchRedDTO;
import com.bacarsa.inventario.models.AccessPoint;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.models.UbicacionRed;
import com.bacarsa.inventario.repository.AccessPointRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;

@Service
public class InfraestructuraMigracionService {

    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;
    private final AccessPointRepository accessPointRepository;
    private final RouterService routerService;
    private final SwitchRedService switchRedService;
    private final AccessPointService accessPointService;
    private final InfraestructuraLimpiezaService limpiezaService;

    public InfraestructuraMigracionService(
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository,
            AccessPointRepository accessPointRepository,
            RouterService routerService,
            SwitchRedService switchRedService,
            AccessPointService accessPointService,
            InfraestructuraLimpiezaService limpiezaService) {
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
        this.accessPointRepository = accessPointRepository;
        this.routerService = routerService;
        this.switchRedService = switchRedService;
        this.accessPointService = accessPointService;
        this.limpiezaService = limpiezaService;
    }

    public Object cambiarTipo(CambiarTipoInfraRequest req) throws ExecutionException, InterruptedException {
        String origen = normalizarTipo(req.getTipoOrigen());
        String destino = normalizarTipo(req.getTipoDestino());
        String id = req.getId().trim();

        if (origen.equals(destino)) {
            return actualizarMismoTipo(destino, id, req);
        }

        verificarExisteOrigen(origen, id);

        // Migración parcial previa: el destino ya tiene el ID, solo actualizar y quitar el origen.
        if (existeDestino(destino, id)) {
            eliminarOrigen(origen, id);
            Object actualizado = actualizarMismoTipo(destino, id, req);
            postMigracionLimpieza(destino, id, req);
            return actualizado;
        }

        escribirDestino(destino, id, req);
        eliminarOrigen(origen, id);
        postMigracionLimpieza(destino, id, req);

        return obtenerDestino(destino, id);
    }

    private Object actualizarMismoTipo(String tipo, String id, CambiarTipoInfraRequest req)
            throws ExecutionException, InterruptedException {
        return switch (tipo) {
            case "router" -> {
                RouterCreateDTO dto = req.getRouter();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del router");
                }
                yield routerService.update(id, dto);
            }
            case "switch" -> {
                SwitchRedCreateDTO dto = req.getSwitchRed();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del switch");
                }
                yield switchRedService.update(id, dto);
            }
            case "access-point" -> {
                AccessPointCreateDTO dto = req.getAccessPoint();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del punto de acceso");
                }
                yield accessPointService.update(id, dto);
            }
            default -> throw new IllegalArgumentException("Tipo inválido: " + tipo);
        };
    }

    private void verificarExisteOrigen(String origen, String id) throws ExecutionException, InterruptedException {
        if (!existeDestino(origen, id)) {
            throw new IllegalArgumentException("No se encontró el equipo en " + origen + ": " + id);
        }
    }

    private boolean existeDestino(String tipo, String id) throws ExecutionException, InterruptedException {
        return switch (tipo) {
            case "router" -> routerRepository.findById(id) != null;
            case "switch" -> switchRedRepository.findById(id) != null;
            case "access-point" -> accessPointRepository.findById(id) != null;
            default -> false;
        };
    }

    private void escribirDestino(String destino, String id, CambiarTipoInfraRequest req)
            throws ExecutionException, InterruptedException {
        switch (destino) {
            case "router" -> {
                RouterCreateDTO dto = req.getRouter();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del router");
                }
                UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());
                Router router = new Router();
                router.setId(id);
                router.setNombre(dto.getNombre().trim());
                router.setMarca(blankToNull(dto.getMarca()));
                router.setModelo(blankToNull(dto.getModelo()));
                router.setIp(blankToNull(dto.getIp()));
                router.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
                router.setFirmware(blankToNull(dto.getFirmware()));
                router.setCantidadPuertosWan(dto.getCantidadPuertosWan());
                router.setCantidadPuertosLan(dto.getCantidadPuertosLan());
                router.setGateway(blankToNull(dto.getGateway()));
                router.setUbicacion(ubicacion);
                routerRepository.guardarConId(id, router);
            }
            case "switch" -> {
                SwitchRedCreateDTO dto = req.getSwitchRed();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del switch");
                }
                UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());
                SwitchRed sw = new SwitchRed();
                sw.setId(id);
                sw.setNombre(dto.getNombre().trim());
                sw.setMarca(blankToNull(dto.getMarca()));
                sw.setModelo(blankToNull(dto.getModelo()));
                sw.setIp(blankToNull(dto.getIp()));
                sw.setNumeroSerie(blankToNull(dto.getNumeroSerie()));
                sw.setCantidadPuertos(dto.getCantidadPuertos());
                sw.setTipo(blankToNull(dto.getTipo()));
                sw.setVlans(dto.getVlans() != null ? dto.getVlans() : java.util.List.of());
                sw.setUbicacion(ubicacion);
                switchRedRepository.guardarConId(id, sw);
            }
            case "access-point" -> {
                AccessPointCreateDTO dto = req.getAccessPoint();
                if (dto == null) {
                    throw new IllegalArgumentException("Faltan datos del punto de acceso");
                }
                UbicacionRed ubicacion = parseUbicacion(dto.getUbicacion());
                AccessPoint ap = new AccessPoint();
                ap.setId(id);
                ap.setNombre(dto.getNombre().trim());
                ap.setMarca(blankToNull(dto.getMarca()));
                ap.setModelo(blankToNull(dto.getModelo()));
                ap.setIp(blankToNull(dto.getIp()));
                ap.setMac(blankToNull(dto.getMac()));
                ap.setSwitchUplink(blankToNull(dto.getSwitchUplink()));
                ap.setUbicacion(ubicacion);
                ap.setEstado(blankToNull(dto.getEstado()) != null ? dto.getEstado().trim() : "OPERATIVO");
                accessPointRepository.guardarConId(id, ap);
            }
            default -> throw new IllegalArgumentException("Tipo destino inválido: " + destino);
        }
    }

    private void eliminarOrigen(String origen, String id) throws ExecutionException, InterruptedException {
        switch (origen) {
            case "router" -> routerRepository.deleteById(id);
            case "switch" -> switchRedRepository.deleteById(id);
            case "access-point" -> accessPointRepository.deleteById(id);
            default -> throw new IllegalArgumentException("Tipo origen inválido: " + origen);
        }
    }

    private Object obtenerDestino(String destino, String id) throws ExecutionException, InterruptedException {
        return switch (destino) {
            case "router" -> routerService.obtenerPorId(id);
            case "switch" -> switchRedService.obtenerPorId(id);
            case "access-point" -> accessPointService.obtenerPorId(id);
            default -> null;
        };
    }

    private static String normalizarTipo(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Tipo requerido");
        }
        String t = raw.trim().toLowerCase();
        if ("ap".equals(t) || "access_point".equals(t) || "access-point".equals(t) || "eap".equals(t)) {
            return "access-point";
        }
        if ("router".equals(t)) {
            return "router";
        }
        if ("switch".equals(t)) {
            return "switch";
        }
        throw new IllegalArgumentException("Tipo no reconocido: " + raw);
    }

    private static UbicacionRed parseUbicacion(String raw) {
        try {
            return UbicacionRed.valueOf(raw.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Ubicación de red inválida: " + raw, ex);
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private void postMigracionLimpieza(String destino, String id, CambiarTipoInfraRequest req)
            throws ExecutionException, InterruptedException {
        if ("access-point".equals(destino) && req.getAccessPoint() != null) {
            limpiezaService.eliminarSwitchesHuerfanosDeMigracion(
                    id,
                    req.getAccessPoint().getNombre(),
                    req.getAccessPoint().getIp());
        } else if ("router".equals(destino) && req.getRouter() != null) {
            limpiezaService.eliminarRoutersDuplicadosDeMigracion(
                    id,
                    req.getRouter().getNombre(),
                    req.getRouter().getIp());
        }
    }
}
