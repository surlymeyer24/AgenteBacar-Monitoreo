package com.bacarsa.inventario.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                "computadoras",
                "camaras",
                "routers",
                "switches",
                "nvrs",
                "maquinasTesoreria",
                "internos",
                "perifericosManuales",
                "servidores",
                "accessPoints",
                "televisores",
                "celulares",
                "usuarios",
                "progresoLogisticaResumen");
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(3, TimeUnit.MINUTES)
                .maximumSize(500));
        return manager;
    }
}
