package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

/**
 * Mapa anidado {@code perifericos} del documento de computadora en Firestore (snapshot del agente).
 * El stock manual vive en {@link PerifericoManual}, no en este mapa.
 */
@Getter
@Setter
public class PerifericosFirestore {

    private List<ImpresoraFirestore> impresoras;
    @Getter(onMethod_ = @PropertyName("dispositivos_usb"))
    @Setter(onMethod_ = @PropertyName("dispositivos_usb"))
    private List<DispositivoUsbFirestore> dispositivosUsb;
    private List<MonitorFirestore> monitores;
    private AudioFirestore audio;

    public PerifericosFirestore() {
        this.impresoras = new ArrayList<>();
        this.dispositivosUsb = new ArrayList<>();
        this.monitores = new ArrayList<>();
        this.audio = new AudioFirestore();
    }
}
