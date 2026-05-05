package com.bacarsa.inventario.models;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoEquipo {
    private String tipo;
    @Getter(onMethod_ = @PropertyName("tiene_bateria"))
    @Setter(onMethod_ = @PropertyName("tiene_bateria"))
    private Boolean tieneBateria;
}
