package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NvrCreateDTO {

    private String dispositivo; // Identificador del documento en Firestore (nombre del dispositivo / serie).
    private String nombre;
    private String direccionIp;
    private Integer puerto;        // opcional; puerto de gestión HTTP/ONVIF de la NVR
    private String descripcion;    // opcional; texto libre
    private String usuario;
    private String password;


}
