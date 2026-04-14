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
}
