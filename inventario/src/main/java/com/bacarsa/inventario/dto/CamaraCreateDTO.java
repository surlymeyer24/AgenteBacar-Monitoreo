package com.bacarsa.inventario.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CamaraCreateDTO {

    private String nombre;
    private String marca;
    private String descripcion;
    private String responsable;
    private String ubicacion;
    /** Si es null, se usa la fecha actual al persistir. */
    private LocalDate fechaAlta;

}
