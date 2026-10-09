package com.bacarsa.inventario.dto;

import lombok.Data;

@Data
public class MigracionHistorialResultDTO {
    private int revisadas;
    private int migradas;
    private int yaMigradas;
    private int fallidas;
    private java.util.List<String> migradasIds = new java.util.ArrayList<>();
    private java.util.List<String> fallidasIds = new java.util.ArrayList<>();
}
