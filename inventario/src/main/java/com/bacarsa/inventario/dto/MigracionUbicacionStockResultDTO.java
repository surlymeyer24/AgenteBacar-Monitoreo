package com.bacarsa.inventario.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MigracionUbicacionStockResultDTO {

    private int procesados;
    private int actualizados;
    private int limpiados;
    private List<String> errores = new ArrayList<>();
}
