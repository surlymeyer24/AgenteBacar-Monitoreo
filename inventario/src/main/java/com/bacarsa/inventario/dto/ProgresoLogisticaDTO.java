package com.bacarsa.inventario.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgresoLogisticaDTO {
    private String uuid;
    private Map<String, Map<String, Boolean>> marcas;
    private int totalItems;
    private int etiquetadoPct;
    private int embaladoPct;
    private int destinoPct;
    private String estado;
    private String ultimaActualizacion;
    private UsuarioAuditoriaDTO ultimoUsuario;
    private List<ActividadLogisticaDTO> historial;
}
