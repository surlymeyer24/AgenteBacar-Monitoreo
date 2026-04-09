package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Computadora {

    private String uuid;
    private String hostname;
    private String usuarioActual;
    private Ubicacion ubicacion;
    private String sistemaOperativo;
    private String arquitectura;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;
    private List<ComponenteHW> componentes;

    public Computadora() {
        this.historialEstados = new ArrayList<>();
        this.componentes = new ArrayList<>();
    }

    public Computadora(String uuid, String hostname, String usuarioActual, Ubicacion ubicacion,
                       String sistemaOperativo, Estado estadoActual) {
        this();
        this.uuid = uuid;
        this.hostname = hostname;
        this.usuarioActual = usuarioActual;
        this.ubicacion = ubicacion;
        this.sistemaOperativo = sistemaOperativo;
        this.estadoActual = estadoActual;
    }

    public Estado getEstadoActual() {
        for (CambioEstado cambio : historialEstados) {
            if (cambio.esEstadoActual()) {
                return cambio.getEstado();
            }
        }
        return estadoActual;
    }

    public void addComponente(ComponenteHW componente) {
        componentes.add(componente);
    }

    public List<ComponenteHW> getComponentes() {
        return componentes;
    }
}
