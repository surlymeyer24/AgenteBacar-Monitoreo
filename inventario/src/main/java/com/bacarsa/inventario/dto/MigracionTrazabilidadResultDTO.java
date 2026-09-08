package com.bacarsa.inventario.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MigracionTrazabilidadResultDTO {

    private int procesados;
    private int migrados;
    private int skipped;
    private int legacy;
    private int stockRetroactivo;
    private List<String> errores = new ArrayList<>();
}
