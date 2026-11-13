package com.bacarsa.inventario.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigracionStockFichasResultDTO {
    private int fichasCreadas;
    private int fichasOmitidas;
    private int movimientosVinculados;
    @Builder.Default
    private List<String> errores = new ArrayList<>();
    private String mensaje;
}
