package com.bacarsa.inventario.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servicio de cifrado y descifrado simétrico reversible (AES-256-GCM)
 * para credenciales de red y video (cámaras, NVRs) en reposo.
 */
@Service
public class CredencialCryptoService {

    private static final Logger log = LoggerFactory.getLogger(CredencialCryptoService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final String PREFIX = "ENC:";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public CredencialCryptoService(
            @Value("${app.security.crypto.secret-key:bacarsa-seguridad-inventario-2026-key}") String rawSecretKey) {
        this.secretKey = derivarClave(rawSecretKey);
    }

    private static SecretKey derivarClave(String rawKey) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Error al derivar clave criptográfica AES", e);
        }
    }

    /**
     * Cifra un texto en claro devolviendo formato ENC:<base64(iv + ciphertext + tag)>.
     * Si ya está cifrado o es nulo/vacío, lo retorna tal cual.
     */
    public String cifrar(String textoPlano) {
        if (textoPlano == null || textoPlano.isBlank()) {
            return textoPlano;
        }
        if (textoPlano.startsWith(PREFIX)) {
            return textoPlano;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(textoPlano.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            return PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException e) {
            log.error("Error al cifrar credencial", e);
            throw new IllegalStateException("No se pudo cifrar la credencial", e);
        }
    }

    /**
     * Descifra una credencial que comienza con ENC:.
     * Si no comienza con ENC: (registro legacy en texto plano) o es nulo/vacío,
     * retorna el texto original de forma retrocompatible.
     */
    public String descifrar(String textoCifrado) {
        if (textoCifrado == null || textoCifrado.isBlank()) {
            return textoCifrado;
        }
        if (!textoCifrado.startsWith(PREFIX)) {
            return textoCifrado; // Legacy en texto plano
        }

        try {
            String b64 = textoCifrado.substring(PREFIX.length());
            byte[] combined = Base64.getDecoder().decode(b64);

            if (combined.length <= GCM_IV_LENGTH) {
                log.warn("Payload cifrado corrupto o demasiado corto");
                return textoCifrado;
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] cipherText = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] decrypted = cipher.doFinal(cipherText);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            log.warn("Error al descifrar credencial, retornando valor original", e);
            return textoCifrado;
        }
    }
}
