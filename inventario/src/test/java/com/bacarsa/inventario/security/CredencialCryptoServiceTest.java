package com.bacarsa.inventario.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CredencialCryptoServiceTest {

    private CredencialCryptoService service;

    @BeforeEach
    void setUp() {
        service = new CredencialCryptoService("test-secret-key-12345");
    }

    @Test
    void cifrarYDescifrarRecuperaTextoOriginal() {
        String original = "Admin_Password_2026!";
        String cifrado = service.cifrar(original);

        assertTrue(cifrado.startsWith("ENC:"));
        assertNotEquals(original, cifrado);

        String recuperado = service.descifrar(cifrado);
        assertEquals(original, recuperado);
    }

    @Test
    void cifrarIdempotenteNoVuelveACifrar() {
        String original = "ClaveSecreta";
        String cifrado1 = service.cifrar(original);
        String cifrado2 = service.cifrar(cifrado1);

        assertEquals(cifrado1, cifrado2);
    }

    @Test
    void descifrarTextoPlanoLegacyDevuelveTextoOriginal() {
        String legacy = "PasswordEnTextoPlano123";
        String resultado = service.descifrar(legacy);

        assertEquals(legacy, resultado);
    }

    @Test
    void nullYBlankSePreservan() {
        assertNull(service.cifrar(null));
        assertEquals("", service.cifrar(""));
        assertEquals("   ", service.cifrar("   "));

        assertNull(service.descifrar(null));
        assertEquals("", service.descifrar(""));
        assertEquals("   ", service.descifrar("   "));
    }

    @Test
    void descifrarPayloadCorruptoRetornaValorSinLanzarExcepcion() {
        String corrupto = "ENC:abc";
        String resultado = service.descifrar(corrupto);

        assertEquals(corrupto, resultado);
    }
}
