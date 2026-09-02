package com.bacarsa.inventario.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InfraestructuraDuplicadoItemDTO {

    private String id;
    private String tipo;
    private String nombre;
    private String ip;
    private String motivo;
    private String conservarTipo;
    private String conservarId;
}
