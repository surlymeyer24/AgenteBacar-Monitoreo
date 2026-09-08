package com.bacarsa.inventario.controller;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.ConciliacionAccionDTO;
import com.bacarsa.inventario.dto.ConciliacionCountDTO;
import com.bacarsa.inventario.dto.ConciliacionListResponseDTO;
import com.bacarsa.inventario.dto.ConciliacionStockDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.services.ConciliacionStockService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/conciliaciones")
public class ConciliacionStockController {

    private final ConciliacionStockService conciliacionStockService;

    public ConciliacionStockController(ConciliacionStockService conciliacionStockService) {
        this.conciliacionStockService = conciliacionStockService;
    }

    @GetMapping
    public ConciliacionListResponseDTO listar(
            @RequestParam(required = false, defaultValue = "PENDIENTE") String decision,
            @RequestParam(required = false, defaultValue = "false") boolean historicoCompleto,
            @RequestParam(required = false, defaultValue = "25") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset)
            throws ExecutionException, InterruptedException {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        int safeOffset = Math.max(offset, 0);
        return conciliacionStockService.listar(decision, historicoCompleto, safeLimit, safeOffset);
    }

    @GetMapping("/pendientes/count")
    public ConciliacionCountDTO contarPendientes() throws ExecutionException, InterruptedException {
        return conciliacionStockService.contarPendientes();
    }

    @GetMapping("/stock-sin-agente")
    public java.util.List<ComputadoraListadoDTO> stockSinAgente()
            throws ExecutionException, InterruptedException {
        return conciliacionStockService.listarStockSinAgente();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConciliacionStockDTO> detalle(@PathVariable String id)
            throws ExecutionException, InterruptedException {
        ConciliacionStockDTO dto = conciliacionStockService.obtenerDetalle(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/confirmar")
    public ConciliacionStockDTO confirmar(@PathVariable String id,
            @RequestBody(required = false) ConciliacionAccionDTO body,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        String usuario = resolveUsuario(request);
        String motivo = body != null ? body.getMotivo() : null;
        return conciliacionStockService.confirmar(id, usuario, motivo);
    }

    @PostMapping("/{id}/rechazar")
    public ConciliacionStockDTO rechazar(@PathVariable String id,
            @RequestBody(required = false) ConciliacionAccionDTO body,
            HttpServletRequest request) throws ExecutionException, InterruptedException {
        String usuario = resolveUsuario(request);
        String motivo = body != null ? body.getMotivo() : null;
        return conciliacionStockService.rechazar(id, usuario, motivo);
    }

    @PostMapping("/{id}/posponer")
    public ConciliacionStockDTO posponer(@PathVariable String id, HttpServletRequest request)
            throws ExecutionException, InterruptedException {
        return conciliacionStockService.posponer(id, resolveUsuario(request));
    }

    private static String resolveUsuario(HttpServletRequest request) {
        Object uid = request.getAttribute("uid");
        if (uid != null) {
            return String.valueOf(uid);
        }
        Object email = request.getAttribute("email");
        return email != null ? String.valueOf(email) : "it";
    }
}
