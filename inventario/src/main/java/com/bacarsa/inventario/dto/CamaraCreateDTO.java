package com.bacarsa.inventario.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CamaraCreateDTO {

    /** Identificador del documento en Firestore (nombre del dispositivo / serie). */
    private String dispositivo;
    private String nombre;
    private String marca;
    private String descripcion;
    private String responsable;
    private String ubicacion;
    private String direccionIp;
    private Integer puerto;
    private String tipo;
    /** Si es null, se usa la fecha actual al persistir. */
    private LocalDate fechaAlta;
    private String nvrId;

}
