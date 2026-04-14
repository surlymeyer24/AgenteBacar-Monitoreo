package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Computadora {

    private String uuid;
    private String hostname;
    private String usuarioActual;
    private Ubicacion ubicacion;
    @Getter(onMethod_ = @PropertyName("sistema_operativo"))
    @Setter(onMethod_ = @PropertyName("sistema_operativo"))
    private String sistemaOperativo;
    private String arquitectura;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;
    private List<Disco> discos;
    @Getter(onMethod_ = @PropertyName("modulos_ram"))
    @Setter(onMethod_ = @PropertyName("modulos_ram"))
    private List<Ram> modulos;
    // Datos de procesador aplanados en el documento de Firestore.
    // El objeto Procesador se arma en el mapper (ProcesadorMapper.toDTO).
    @Getter(onMethod_ = @PropertyName("procesador"))
    @Setter(onMethod_ = @PropertyName("procesador"))
    private String procesadorRaw;
    @Getter(onMethod_ = @PropertyName("nucleos_fisicos"))
    @Setter(onMethod_ = @PropertyName("nucleos_fisicos"))
    private int nucleosFisicos;
    /** Valor crudo del agente (p. ej. ONLINE, OFFLINE). */
    @Getter(onMethod_ = @PropertyName("estado_conexion"))
    @Setter(onMethod_ = @PropertyName("estado_conexion"))
    private String estadoConexion;
    @Getter(onMethod_ = @PropertyName("ultima_sincronizacion"))
    @Setter(onMethod_ = @PropertyName("ultima_sincronizacion"))
    private Timestamp ultimaSincronizacion;

    /** Snapshot {@code perifericos} del agente en Firestore; ver {@link PerifericosFirestore}. */
    @Getter(onMethod_ = @PropertyName("perifericos"))
    @Setter(onMethod_ = @PropertyName("perifericos"))
    private PerifericosFirestore perifericos;


    public Computadora() {
        this.historialEstados = new ArrayList<>();
        this.discos = new ArrayList<>();
        this.modulos = new ArrayList<>();
    }

    public Computadora(String uuid, String hostname, String usuarioActual, Ubicacion ubicacion,
                       String sistemaOperativo, Estado estadoActual) {
        this();
        this.uuid = uuid;
        this.hostname = hostname;
        this.usuarioActual = usuarioActual;
        this.ubicacion = ubicacion;
        this.sistemaOperativo = sistemaOperativo;
        this.estadoActual = estadoActual;
    }

    public Estado getEstadoActual() {
        if (historialEstados != null) {
            for (CambioEstado cambio : historialEstados) {
                if (cambio.esEstadoActual()) {
                    return cambio.getEstado();
                }
            }
        }
        return estadoActual;
    }

}
