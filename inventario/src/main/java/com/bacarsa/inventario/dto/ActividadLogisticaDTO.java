package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActividadLogisticaDTO {
    private String fase;
    private String accion;
    private List<String> itemIds;
    private UsuarioAuditoriaDTO usuario;
    private String fechaHora;
}
