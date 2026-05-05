package com.bacarsa.inventario.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MigracionEstadoMasivoResultDTO {

    private int computadorasActualizadas;
    private int computadorasOmitidas;
    private int camarasActualizadas;
    private int camarasOmitidas;
    private List<String> fallos = new ArrayList<>();
}
