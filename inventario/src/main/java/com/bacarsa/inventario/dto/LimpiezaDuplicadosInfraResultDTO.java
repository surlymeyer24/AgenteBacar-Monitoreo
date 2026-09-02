package com.bacarsa.inventario.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LimpiezaDuplicadosInfraResultDTO {

    private int eliminados;
    private List<InfraestructuraDuplicadoItemDTO> detalle = new ArrayList<>();
}
