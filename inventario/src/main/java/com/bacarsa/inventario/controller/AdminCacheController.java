package com.bacarsa.inventario.controller;

import java.util.Collection;
import java.util.Map;

import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cache")
public class AdminCacheController {

    private final CacheManager cacheManager;

    public AdminCacheController(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @PostMapping("/evict")
    public ResponseEntity<?> evict(@RequestParam(required = false) String nombre) {
        if (nombre != null && !nombre.isBlank()) {
            var cache = cacheManager.getCache(nombre);
            if (cache == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Cache no encontrada: " + nombre,
                        "disponibles", cacheManager.getCacheNames()));
            }
            cache.clear();
            return ResponseEntity.ok(Map.of("evicted", nombre));
        }
        Collection<String> names = cacheManager.getCacheNames();
        names.forEach(n -> {
            var cache = cacheManager.getCache(n);
            if (cache != null) cache.clear();
        });
        return ResponseEntity.ok(Map.of("evicted", "all", "caches", names));
    }
}
