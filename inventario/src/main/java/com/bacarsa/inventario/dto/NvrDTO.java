package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NvrDTO {
    private String id;
    private String nombre;
    private String direccionIp;
    private Integer puerto;        // opcional; puerto de gestión HTTP/ONVIF de la NVR
    private String descripcion;    // opcional; texto libre
    private List<CamaraDTO> camaras;
    /** Cámaras con este {@code nvrId}; informado en listados y detalle. */
    private Integer cantidadCamaras;
}
