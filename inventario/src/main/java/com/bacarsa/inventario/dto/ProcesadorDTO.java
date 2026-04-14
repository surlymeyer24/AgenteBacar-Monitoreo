package com.bacarsa.inventario.dto;

import com.bacarsa.inventario.models.FabricanteProcesador;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcesadorDTO {

    private String nombreRaw;
    private int nucleosFisicos;
    private String arquitectura;
    private FabricanteProcesador fabricante;
}
