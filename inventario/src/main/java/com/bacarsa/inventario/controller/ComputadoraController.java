package com.bacarsa.inventario.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.dto.CambiarEstadoDTO;
import com.bacarsa.inventario.dto.ComandoDTO;
import com.bacarsa.inventario.dto.ComandoMasivoDTO;
import com.bacarsa.inventario.dto.ComputadoraCreateDTO;
import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.dto.ComputadoraListadoDTO;
import com.bacarsa.inventario.dto.ResponsableInventarioDTO;
import com.bacarsa.inventario.dto.UbicacionUpdateDTO;
import com.bacarsa.inventario.models.DispositivoAudioFirestore;
import com.bacarsa.inventario.models.DispositivoUsbFirestore;
import com.bacarsa.inventario.models.ImpresoraFirestore;
import com.bacarsa.inventario.models.MonitorFirestore;
import com.bacarsa.inventario.services.ComputadoraService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/computadoras")
public class ComputadoraController {

    private final ComputadoraService computadoraService;

    public ComputadoraController(ComputadoraService computadoraService) {
        this.computadoraService = computadoraService;
    }

    @GetMapping("/recientes")
    public ResponseEntity<List<ComputadoraListadoDTO>> listarRecientes(
            @RequestParam(name = "limit", defaultValue = "8") int limit)
            throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(computadoraService.getRecientes(Math.min(limit, 50)));
    }

    @GetMapping
    public ResponseEntity<List<ComputadoraListadoDTO>> listarTodas(
            @RequestParam(name = "ubicacion", required = false) String ubicacion)
            throws ExecutionException, InterruptedException {
        try {
            return ResponseEntity.ok(computadoraService.listarComputadoras(ubicacion));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ComputadoraDTO> crear(@Valid @RequestBody ComputadoraCreateDTO body)
            throws ExecutionException, InterruptedException {
        try {
            ComputadoraDTO creada = computadoraService.crear(body);
            return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ComputadoraDTO> obtenerPorUuid(@PathVariable String uuid) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.getByUuid(uuid);
        if (dto == null) {
            
            return ResponseEntity.notFound().build();
            
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/perifericos/impresoras")
    public ResponseEntity<ComputadoraDTO> agregarImpresora(
            @PathVariable String uuid,
            @RequestBody ImpresoraFirestore body) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.agregarImpresora(uuid, body);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/perifericos/monitores")
    public ResponseEntity<ComputadoraDTO> agregarMonitor(
            @PathVariable String uuid,
            @RequestBody MonitorFirestore body) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.agregarMonitor(uuid, body);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/perifericos/usb")
    public ResponseEntity<ComputadoraDTO> agregarDispositivoUsb(
            @PathVariable String uuid,
            @RequestBody DispositivoUsbFirestore body) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.agregarDispositivoUsb(uuid, body);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/perifericos/audio/entrada")
    public ResponseEntity<ComputadoraDTO> agregarAudioEntrada(
            @PathVariable String uuid,
            @RequestBody DispositivoAudioFirestore body) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.agregarAudioEntrada(uuid, body);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/perifericos/audio/salida")
    public ResponseEntity<ComputadoraDTO> agregarAudioSalida(
            @PathVariable String uuid,
            @RequestBody DispositivoAudioFirestore body) throws ExecutionException, InterruptedException {
        ComputadoraDTO dto = computadoraService.agregarAudioSalida(uuid, body);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/{uuid}/ubicacion")
    public ResponseEntity<ComputadoraDTO> actualizarUbicacion(
            @PathVariable String uuid,
            @Valid @RequestBody UbicacionUpdateDTO body) throws ExecutionException, InterruptedException {
        try {
            ComputadoraDTO dto = computadoraService.actualizarUbicacion(uuid, body.getUbicacion());
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{uuid}/estado")
    public ResponseEntity<ComputadoraDTO> actualizarEstado(
            @PathVariable String uuid,
            @Valid @RequestBody CambiarEstadoDTO body) throws ExecutionException, InterruptedException {
        try {
            ComputadoraDTO dto = computadoraService.cambiarEstado(uuid, body);
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> eliminar(@PathVariable String uuid) throws ExecutionException, InterruptedException {
        boolean ok = computadoraService.eliminar(uuid);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/{uuid}/responsable-inventario")
    public ResponseEntity<ComputadoraDTO> actualizarResponsableInventario(
        @PathVariable String uuid,
        @Valid @RequestBody ResponsableInventarioDTO body)
        throws ExecutionException, InterruptedException {
            try {
                ComputadoraDTO dto = computadoraService.actualizarResponsableInventario(
                    uuid,
                    body != null ? body.getResponsableInventario() : null
                );
                if (dto == null) {
                    return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
            }
    }

    @PostMapping("/{uuid}/comando")
    public ResponseEntity<Void> enviarComando(
            @PathVariable String uuid,
            @Valid @RequestBody ComandoDTO body)
            throws ExecutionException, InterruptedException {
        boolean existe = computadoraService.enviarComando(uuid, body.getComando());
        return existe ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/comando-masivo")
    public ResponseEntity<java.util.Map<String, Integer>> enviarComandoMasivo(
            @Valid @RequestBody ComandoMasivoDTO body)
            throws ExecutionException, InterruptedException {
        int enviados = computadoraService.enviarComandoMasivo(body.getUuids(), body.getComando());
        return ResponseEntity.ok(java.util.Map.of("enviados", enviados));
    }

}
