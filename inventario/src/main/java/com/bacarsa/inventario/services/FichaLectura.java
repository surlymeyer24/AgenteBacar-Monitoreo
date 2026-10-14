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
            String ubicacion) {
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
        String codigo = enBlanco(codigoInterno) ? null : codigoInterno.trim();
        String prefijoAsignable = motivoOmitir == null ? prefijo : null;
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
                vacio(ubicacion));
    }

    public boolean entraEnListado() {
        return motivoOmitir == null && codigoInterno != null;
    }

    public UnidadStockDTO aDto() {
        UnidadStockDTO dto = new UnidadStockDTO();
        dto.setCodigo(codigoInterno == null ? "" : codigoInterno);
        dto.setTipo(tipo);
        dto.setMarca(marca);
        dto.setModelo(modelo);
        dto.setSerieOImei(serieOImei);
        dto.setCondicion(condicion);
        dto.setEstadoDeposito(estadoDeposito);
        dto.setFechaIngreso(fechaIngreso);
        dto.setUbicacion(ubicacion);
        return dto;
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
