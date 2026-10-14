package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SesionBloqueoDTO {

    private String id;
    private String computadoraId;
    private String hostname;
    private String ubicacion;
    /** ISO-8601 desde Firestore `bloqueado_en`. */
    private String bloqueadoEn;
    private String estadoAnterior;
    private Integer sesionBloqueoAutoMin;
}
