package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaquinaTesoreriaCreateDTO {

    /** Valor del enum TipoMaquina (VALIDADORA, BOLSILLOS, RECONTADORA, ENVASADORA, FAJADORA). */
    private String tipo;
    private String modelo;
    private String nroSerie;
    /** Observación libre, opcional. */
    private String vida;
    /** Estado inicial: ASIGNADA, SIN_ASIGNAR, EN_MANTENIMIENTO o BAJA. */
    private String estado;
    private String motivo;
}
