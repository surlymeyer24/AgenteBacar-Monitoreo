package com.bacarsa.inventario.config;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.caffeine.CaffeineCache;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache("pc-listado", 60, 10),
                buildCache("pc-detalle", 120, 500),
                buildCache("pc-programas", 120, 500),
                buildCache("computadoras-gordo", 180, 1),

                buildCache("camaras", 180, 500),
                buildCache("routers", 180, 500),
                buildCache("switches", 180, 500),
                buildCache("nvrs", 180, 500),
                buildCache("maquinasTesoreria", 180, 500),
                buildCache("internos", 180, 500),
                buildCache("perifericosManuales", 180, 500),
                buildCache("servidores", 180, 500),
                buildCache("accessPoints", 180, 500),
                buildCache("televisores", 180, 500),
                buildCache("celulares", 180, 500),
                buildCache("usuarios", 180, 500),
                buildCache("progresoLogisticaResumen", 180, 500)
        ));
        return manager;
    }

    private static CaffeineCache buildCache(String name, long ttlSeconds, long maxSize) {
        return new CaffeineCache(name, Caffeine.newBuilder()
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .maximumSize(maxSize)
                .build());
    }
}
