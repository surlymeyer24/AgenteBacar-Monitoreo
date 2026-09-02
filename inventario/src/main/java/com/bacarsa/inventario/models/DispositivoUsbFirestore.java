package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

/**
 * Elemento de {@code perifericos.dispositivos_usb} en Firestore.
 */
@Getter
@Setter
public class DispositivoUsbFirestore {

    private String nombre;
    private String fabricante;
    private String categoria;
    private String clase;
    private String conexion;
    /** Vendor ID USB (hex, p. ej. {@code 046D}), si el agente lo reportó. */
    private String vid;
    /** Product ID USB (hex, p. ej. {@code C52B}), si el agente lo reportó. */
    private String pid;
}
