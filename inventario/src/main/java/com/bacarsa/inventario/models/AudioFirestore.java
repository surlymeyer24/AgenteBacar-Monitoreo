package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Objeto {@code perifericos.audio} en Firestore.
 */
@Getter
@Setter
public class AudioFirestore {

    private List<DispositivoAudioFirestore> entrada;
    private List<DispositivoAudioFirestore> salida;

    public AudioFirestore() {
        this.entrada = new ArrayList<>();
        this.salida = new ArrayList<>();
    }
}
