package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PerifericoManual {

    @DocumentId
    private String id;

    private String tipo;
    private int cantidad = 1;
    private String nombre;
    private String fabricante;
    private String conexion;
    private String computadoraHostname;

    @Getter(onMethod_ = @PropertyName("computadora_uuid"))
    @Setter(onMethod_ = @PropertyName("computadora_uuid"))
    private String computadoraUuid;

    private String ubicacion;
    private String notas;
    /** ISO-8601 fecha calendario ({@code yyyy-MM-dd}). */
    private String fechaAlta;
    private String comboId;
    private String comboNombre;

    @Getter(onMethod_ = @PropertyName("especificacion_stock"))
    @Setter(onMethod_ = @PropertyName("especificacion_stock"))
    private EspecificacionStock especificacionStock;

    @Getter(onMethod_ = @PropertyName("numero_serie"))
    @Setter(onMethod_ = @PropertyName("numero_serie"))
    private String numeroSerie;

    private Estado estadoActual;
    private List<CambioEstado> historialEstados;

    public PerifericoManual() {
        this.historialEstados = new ArrayList<>();
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
