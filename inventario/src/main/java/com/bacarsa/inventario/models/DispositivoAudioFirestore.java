package com.bacarsa.inventario.models;

import lombok.Getter;
import lombok.Setter;

/**
 * Entrada o salida dentro de {@code perifericos.audio} en Firestore.
 */
@Getter
@Setter
public class DispositivoAudioFirestore {

    private String nombre;
    private String fabricante;
    /** Estado del dispositivo según el agente; no es estado IT. */
    private String estado;
}
