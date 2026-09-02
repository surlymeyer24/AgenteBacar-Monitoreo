package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraListadoDTO {

    private String uuid;
    private String hostname;
    private String tipoEquipo;
    private String usuarioActual;
    private String ubicacion;
    private String sistemaOperativo;
    private String arquitectura;
    private String estadoActual;
    private String estadoConexion;
    private String estadoAgente;
    private String ultimaSincronizacion;
    private String procesadorNombre;
    private String responsableInventario;
    private String anydeskId;
    private String ubicacionStock;
}
