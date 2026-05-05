package com.bacarsa.inventario.services;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.bacarsa.inventario.dto.ResultadoBusquedaDTO;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.Router;
import com.bacarsa.inventario.models.SwitchRed;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.repository.ComputadoraRepository;
import com.bacarsa.inventario.repository.RouterRepository;
import com.bacarsa.inventario.repository.SwitchRedRepository;

@Service
public class BusquedaService {

    private static final int MAX_POR_TIPO = 10;

    private final ComputadoraRepository computadoraRepository;
    private final CamaraRepository camaraRepository;
    private final RouterRepository routerRepository;
    private final SwitchRedRepository switchRedRepository;

    public BusquedaService(ComputadoraRepository computadoraRepository,
            CamaraRepository camaraRepository,
            RouterRepository routerRepository,
            SwitchRedRepository switchRedRepository) {
        this.computadoraRepository = computadoraRepository;
        this.camaraRepository = camaraRepository;
        this.routerRepository = routerRepository;
        this.switchRedRepository = switchRedRepository;
    }

    public List<ResultadoBusquedaDTO> buscar(String q) throws ExecutionException, InterruptedException {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }

        String busqueda = normalizar(q);
        List<ResultadoBusquedaDTO> resultados = new ArrayList<>();

        List<Computadora> computadoras = computadoraRepository.findAll();
        int countPc = 0;
        for (Computadora pc : computadoras) {
            if (countPc >= MAX_POR_TIPO) break;
            if (matchComputadora(pc, busqueda)) {
                resultados.add(toDTO(pc));
                countPc++;
            }
        }

        List<Camara> camaras = camaraRepository.findAll();
        int countCam = 0;
        for (Camara cam : camaras) {
            if (countCam >= MAX_POR_TIPO) break;
            if (matchCamara(cam, busqueda)) {
                resultados.add(toDTO(cam));
                countCam++;
            }
        }

        List<Router> routers = routerRepository.findAll();
        int countRouter = 0;
        for (Router r : routers) {
            if (countRouter >= MAX_POR_TIPO) break;
            if (matchRouter(r, busqueda)) {
                resultados.add(toDTO(r));
                countRouter++;
            }
        }

        List<SwitchRed> switches = switchRedRepository.findAll();
        int countSwitch = 0;
        for (SwitchRed sw : switches) {
            if (countSwitch >= MAX_POR_TIPO) break;
            if (matchSwitch(sw, busqueda)) {
                resultados.add(toDTO(sw));
                countSwitch++;
            }
        }

        return resultados;
    }

    private boolean matchComputadora(Computadora pc, String busqueda) {
        return contiene(pc.getHostname(), busqueda)
                || contiene(pc.getUsuarioActual(), busqueda)
                || contiene(pc.getUuid(), busqueda)
                || contiene(pc.getUbicacion() != null ? pc.getUbicacion().name() : null, busqueda);
    }

    private boolean matchCamara(Camara cam, String busqueda) {
        return contiene(cam.getNombre(), busqueda)
                || contiene(cam.getMarca(), busqueda)
                || contiene(cam.getId(), busqueda)
                || contiene(cam.getUbicacion(), busqueda)
                || contiene(cam.getDescripcion(), busqueda)
                || contiene(cam.getDireccionIp(), busqueda)
                || contiene(cam.getTipo(), busqueda)
                || contiene(cam.getPuerto() != null ? cam.getPuerto().toString() : null, busqueda);
    }

    private boolean matchRouter(Router r, String busqueda) {
        return contiene(r.getNombre(), busqueda)
                || contiene(r.getMarca(), busqueda)
                || contiene(r.getModelo(), busqueda)
                || contiene(r.getIp(), busqueda)
                || contiene(r.getId(), busqueda)
                || contiene(r.getUbicacion() != null ? r.getUbicacion().name() : null, busqueda);
    }

    private boolean matchSwitch(SwitchRed sw, String busqueda) {
        return contiene(sw.getNombre(), busqueda)
                || contiene(sw.getMarca(), busqueda)
                || contiene(sw.getModelo(), busqueda)
                || contiene(sw.getIp(), busqueda)
                || contiene(sw.getId(), busqueda)
                || contiene(sw.getUbicacion() != null ? sw.getUbicacion().name() : null, busqueda);
    }

    private boolean contiene(String campo, String busqueda) {
        if (campo == null) return false;
        return normalizar(campo).contains(busqueda);
    }

    private ResultadoBusquedaDTO toDTO(Computadora pc) {
        String estado = pc.getEstadoActual() != null ? pc.getEstadoActual().getNombre() : "";
        String ubicacion = pc.getUbicacion() != null ? pc.getUbicacion().name() : "";
        return new ResultadoBusquedaDTO(
                "computadora",
                pc.getUuid(),
                pc.getHostname(),
                estado,
                ubicacion,
                "/computadoras/" + pc.getUuid()
        );
    }

    private ResultadoBusquedaDTO toDTO(Camara cam) {
        String estado = cam.getEstadoActual() != null ? cam.getEstadoActual().getNombre() : "";
        String ubicacion = cam.getUbicacion() != null ? cam.getUbicacion() : "";
        return new ResultadoBusquedaDTO(
                "camara",
                cam.getId(),
                cam.getNombre(),
                estado,
                ubicacion,
                "/camaras/" + cam.getId()
        );
    }

    private ResultadoBusquedaDTO toDTO(Router r) {
        String estado = r.getEstadoActual() != null ? r.getEstadoActual().getNombre() : "";
        String ubicacion = r.getUbicacion() != null ? r.getUbicacion().name() : "";
        return new ResultadoBusquedaDTO(
                "router",
                r.getId(),
                r.getNombre(),
                estado,
                ubicacion,
                "/routers/" + r.getId()
        );
    }

    private ResultadoBusquedaDTO toDTO(SwitchRed sw) {
        String estado = sw.getEstadoActual() != null ? sw.getEstadoActual().getNombre() : "";
        String ubicacion = sw.getUbicacion() != null ? sw.getUbicacion().name() : "";
        return new ResultadoBusquedaDTO(
                "switch",
                sw.getId(),
                sw.getNombre(),
                estado,
                ubicacion,
                "/switches/" + sw.getId()
        );
    }

    private String normalizar(String texto) {
        if (texto == null) return "";
        return Normalizer.normalize(texto.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("\\s+", " ");
    }
}
