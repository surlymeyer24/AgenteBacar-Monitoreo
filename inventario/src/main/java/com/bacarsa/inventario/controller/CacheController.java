package com.bacarsa.inventario.controller;

import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cache")
public class CacheController {

    private final CacheManager cacheManager;

    public CacheController(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Invalida todos los cachés manualmente.
     * Útil cuando el agente C# escribe directamente a Firestore
     * y se necesita forzar un refresh sin esperar el TTL de 3 min.
     */
    @DeleteMapping
    public ResponseEntity<String> invalidarTodo() {
        cacheManager.getCacheNames().forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        });
        return ResponseEntity.ok("Cachés invalidados: " + cacheManager.getCacheNames());
    }
}
