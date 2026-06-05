package com.bacarsa.inventario.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class AnydeskIdResolverTest {

    @Test
    void resuelveStringTopLevel() {
        Map<String, Object> data = Map.of("anydesk_id", "1864637830");
        assertEquals("1864637830", AnydeskIdResolver.resolver(data));
    }

    @Test
    void resuelveNumeroTopLevel() {
        Map<String, Object> data = Map.of("anydesk_id", 1864637830L);
        assertEquals("1864637830", AnydeskIdResolver.resolver(data));
    }

    @Test
    void resuelveCamelCase() {
        Map<String, Object> data = Map.of("anydeskId", 812126105);
        assertEquals("812126105", AnydeskIdResolver.resolver(data));
    }

    @Test
    void resuelveDesdeUsuariosAnidado() {
        Map<String, Object> data = Map.of(
                "usuarios", Map.of("anydesk_id", "1243642720")
        );
        assertEquals("1243642720", AnydeskIdResolver.resolver(data));
    }

    @Test
    void resuelveDesdeImpresoraAnydesk() {
        Map<String, Object> imp = new HashMap<>();
        imp.put("nombre", "AnyDesk Printer");
        imp.put("driver", "AnyDesk v4 Printer Driver");
        imp.put("puerto", "ad_port 520887141");
        Map<String, Object> data = Map.of(
                "perifericos", Map.of("impresoras", List.of(imp))
        );
        assertEquals("520887141", AnydeskIdResolver.resolver(data));
    }

    @Test
    void retornaNullSiNoHayDatos() {
        assertNull(AnydeskIdResolver.resolver(Map.of()));
        assertNull(AnydeskIdResolver.resolver(null));
    }
}
