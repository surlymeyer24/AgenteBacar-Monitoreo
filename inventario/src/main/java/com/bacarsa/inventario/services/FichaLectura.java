package com.bacarsa.inventario.services;

import com.bacarsa.inventario.dto.UnidadStockDTO;

import lombok.Getter;

@Getter
public final class FichaLectura {

    private final String coleccion;
    private final String id;
    private final String codigoInterno;
    private final String prefijo;
    private final String motivoOmitir;
    private final String tipo;
    private final String marca;
    private final String modelo;
    private final String serieOImei;
    private final String condicion;
    private final String estadoDeposito;
    private final String fechaIngreso;
    private final String ubicacion;
    private final Integer cantidad;
    private final String comentarios;
    private String descripcionCompleta = "";

    private FichaLectura(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            String motivoOmitir,
            String tipo,
            String marca,
            String modelo,
            String serieOImei,
            String condicion,
            String estadoDeposito,
            String fechaIngreso,
            String ubicacion,
            Integer cantidad,
            String comentarios) {
        this.coleccion = coleccion;
        this.id = id == null ? "" : id;
        this.codigoInterno = codigoInterno;
        this.prefijo = prefijo;
        this.motivoOmitir = motivoOmitir;
        this.tipo = tipo;
        this.marca = marca;
        this.modelo = modelo;
        this.serieOImei = serieOImei;
        this.condicion = condicion;
        this.estadoDeposito = estadoDeposito;
        this.fechaIngreso = fechaIngreso;
        this.ubicacion = ubicacion;
        this.cantidad = cantidad;
        this.comentarios = comentarios;
    }

    public static FichaLectura de(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            String motivoOmitir,
            String tipo,
            String marca,
            String modelo,
            String serieOImei,
            String condicion,
            String estadoDeposito,
            String fechaIngreso,
            String ubicacion) {
        return de(
                coleccion,
                id,
                codigoInterno,
                prefijo,
                motivoOmitir,
                tipo,
                marca,
                modelo,
                serieOImei,
                condicion,
                estadoDeposito,
                fechaIngreso,
                ubicacion,
                1,
                null);
    }

    public static FichaLectura de(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            String motivoOmitir,
            String tipo,
            String marca,
            String modelo,
            String serieOImei,
            String condicion,
            String estadoDeposito,
            String fechaIngreso,
            String ubicacion,
            Integer cantidad) {
        return de(
                coleccion,
                id,
                codigoInterno,
                prefijo,
                motivoOmitir,
                tipo,
                marca,
                modelo,
                serieOImei,
                condicion,
                estadoDeposito,
                fechaIngreso,
                ubicacion,
                cantidad,
                null);
    }

    public static FichaLectura de(
            String coleccion,
            String id,
            String codigoInterno,
            String prefijo,
            String motivoOmitir,
            String tipo,
            String marca,
            String modelo,
            String serieOImei,
            String condicion,
            String estadoDeposito,
            String fechaIngreso,
            String ubicacion,
            Integer cantidad,
            String comentarios) {
        String codigo = enBlanco(codigoInterno) ? null : codigoInterno.trim();
        String prefijoAsignable = prefijo;
        return new FichaLectura(
                coleccion,
                id,
                codigo,
                prefijoAsignable,
                motivoOmitir,
                vacio(tipo),
                vacio(marca),
                vacio(modelo),
                vacio(serieOImei),
                vacio(condicion),
                vacio(estadoDeposito),
                vacio(fechaIngreso),
                vacio(ubicacion),
                cantidad != null ? cantidad : 1,
                vacio(comentarios));
    }

    public boolean entraEnListado() {
        return motivoOmitir == null && (codigoInterno != null || "perifericos_manuales".equals(coleccion) || "celulares".equals(coleccion) || "computadoras".equals(coleccion));
    }

    public UnidadStockDTO aDto() {
        UnidadStockDTO dto = new UnidadStockDTO();
        dto.setId(id);
        dto.setCodigo(codigoInterno != null && !codigoInterno.isBlank() ? codigoInterno : id);
        dto.setColeccion(coleccion);
        dto.setTipo(tipo);
        dto.setMarca(marca);
        dto.setModelo(modelo);
        dto.setSerieOImei(serieOImei);
        dto.setCondicion(condicion);
        dto.setEstadoDeposito(estadoDeposito);
        dto.setFechaIngreso(fechaIngreso);
        dto.setUbicacion(ubicacion);
        dto.setCantidad(cantidad != null ? cantidad : 1);
        dto.setComentarios(comentarios);
        dto.setDescripcionCompleta(descripcionCompleta);
        return dto;
    }

    void setDescripcionCompleta(String descripcionCompleta) {
        this.descripcionCompleta = descripcionCompleta != null ? descripcionCompleta : "";
    }

    public String referencia() {
        return "coleccion=" + coleccion + " id=" + id;
    }

    private static boolean enBlanco(String valor) {
        return valor == null || valor.isBlank();
    }

    private static String vacio(String valor) {
        return valor == null ? "" : valor;
    }
}
