package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComputadoraDTO {
    private String uuid;
    private String hostname;
    private String usuarioActual;
    private String ubicacion;
    private String sistemaOperativo;
    private String arquitectura;
    /** Estado operativo manual de IT (Firestore / historial), si existe. */
    private String estadoActual;
    /** Activo / Desconectado según `estado_conexion` del agente. */
    private String estadoAgente;
    /** Valor crudo del agente (p. ej. ONLINE, OFFLINE); útil si el front necesita fallback. */
    private String estadoConexion;
    /** ISO-8601 generado en el mapper desde `Timestamp` de Firestore. */
    private String ultimaSincronizacion;
    private ProcesadorDTO procesador;
    private List<DiscoDTO> discos;
    private List<RamDTO> modulos;
    private PerifericoAgenteDTO perifericos;
    private List<CambioEstadoDTO> historialEstados;


}
