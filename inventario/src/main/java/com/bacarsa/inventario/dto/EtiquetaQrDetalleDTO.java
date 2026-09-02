package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtiquetaQrDetalleDTO {
    private String uuid;
    private String hostname;
    private String usuarioActual;
    private String ubicacion;
    private String tipoEquipo;
    private String responsableInventario;
    private List<EtiquetaQrItemDTO> monitores;
    private List<EtiquetaQrItemDTO> perifericos;
}
