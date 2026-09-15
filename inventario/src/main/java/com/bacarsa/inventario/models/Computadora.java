package com.bacarsa.inventario.models;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.PropertyName;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Computadora {

    private String uuid;
    private String hostname;
    private String usuarioActual;
    private Ubicacion ubicacion;
    @Getter(onMethod_ = @PropertyName("sistema_operativo"))
    @Setter(onMethod_ = @PropertyName("sistema_operativo"))
    private String sistemaOperativo;
    private String arquitectura;
    private Estado estadoActual;
    private List<CambioEstado> historialEstados;
    private List<Disco> discos;
    @Getter(onMethod_ = @PropertyName("modulos_ram"))
    @Setter(onMethod_ = @PropertyName("modulos_ram"))
    private List<Ram> modulos;
    // Datos de procesador aplanados en el documento de Firestore.
    // El objeto Procesador se arma en el mapper (ProcesadorMapper.toDTO).
    @Getter(onMethod_ = @PropertyName("procesador"))
    @Setter(onMethod_ = @PropertyName("procesador"))
    private String procesadorRaw;
    @Getter(onMethod_ = @PropertyName("nucleos_fisicos"))
    @Setter(onMethod_ = @PropertyName("nucleos_fisicos"))
    private int nucleosFisicos;
    @Getter(onMethod_ = @PropertyName("procesador_detallado"))
    @Setter(onMethod_ = @PropertyName("procesador_detallado"))
    private ProcesadorDetallado procesadorDetallado;
    @Getter(onMethod_ = @PropertyName("ram_placa"))
    @Setter(onMethod_ = @PropertyName("ram_placa"))
    private RamPlaca ramPlaca;
    @Getter(onMethod_ = @PropertyName("ram_total_gb"))
    @Setter(onMethod_ = @PropertyName("ram_total_gb"))
    private Double ramTotalGb;
    @Getter(onMethod_ = @PropertyName("cpu_uso_porcentaje"))
    @Setter(onMethod_ = @PropertyName("cpu_uso_porcentaje"))
    private Double cpuUsoPorcentaje;
    @Getter(onMethod_ = @PropertyName("ram_uso_porcentaje"))
    @Setter(onMethod_ = @PropertyName("ram_uso_porcentaje"))
    private Double ramUsoPorcentaje;
    /** Valor crudo del agente (p. ej. ONLINE, OFFLINE). */
    @Getter(onMethod_ = @PropertyName("estado_conexion"))
    @Setter(onMethod_ = @PropertyName("estado_conexion"))
    private String estadoConexion;
    @Getter(onMethod_ = @PropertyName("ultima_sincronizacion"))
    @Setter(onMethod_ = @PropertyName("ultima_sincronizacion"))
    private Timestamp ultimaSincronizacion;

    @Getter(onMethod_ = @PropertyName("tipo_equipo"))
    @Setter(onMethod_ = @PropertyName("tipo_equipo"))
    private TipoEquipo tipoEquipo;

    /** Snapshot {@code perifericos} del agente en Firestore; ver {@link PerifericosFirestore}. */
    @Getter(onMethod_ = @PropertyName("perifericos"))
    @Setter(onMethod_ = @PropertyName("perifericos"))
    private PerifericosFirestore perifericos;

    /** Detalle de versión de Windows reportado por el agente (mapa en Firestore). */
    @Getter(onMethod_ = @PropertyName("windows_version_detallada"))
    @Setter(onMethod_ = @PropertyName("windows_version_detallada"))
    private Map<String, Object> windowsVersionDetallada;

    @Getter(onMethod_ = @PropertyName("responsable_inventario"))
    @Setter(onMethod_ = @PropertyName("responsable_inventario"))
    private String responsableInventario;

    @Getter(onMethod_ = @PropertyName("anydesk_id"))
    @Setter(onMethod_ = @PropertyName("anydesk_id"))
    private String anydeskId;

    private String condicion;

    @Getter(onMethod_ = @PropertyName("origen_alta"))
    @Setter(onMethod_ = @PropertyName("origen_alta"))
    private OrigenAlta origenAlta;

    @Deprecated
    @Getter(onMethod_ = @PropertyName("estado_conciliacion"))
    @Setter(onMethod_ = @PropertyName("estado_conciliacion"))
    private EstadoConciliacion estadoConciliacion;

    @Getter(onMethod_ = @PropertyName("estado_preparacion"))
    @Setter(onMethod_ = @PropertyName("estado_preparacion"))
    private EstadoPreparacion estadoPreparacion;

    @Getter(onMethod_ = @PropertyName("estado_reporte_agente"))
    @Setter(onMethod_ = @PropertyName("estado_reporte_agente"))
    private EstadoReporteAgente estadoReporteAgente;

    @Getter(onMethod_ = @PropertyName("baseline_esperado"))
    @Setter(onMethod_ = @PropertyName("baseline_esperado"))
    private BaselineEsperado baselineEsperado;

    @Getter(onMethod_ = @PropertyName("combo_esperado_id"))
    @Setter(onMethod_ = @PropertyName("combo_esperado_id"))
    private String comboEsperadoId;

    @Getter(onMethod_ = @PropertyName("primer_reporte_agente_at"))
    @Setter(onMethod_ = @PropertyName("primer_reporte_agente_at"))
    private Timestamp primerReporteAgenteAt;

    @Getter(onMethod_ = @PropertyName("matching_job_estado"))
    @Setter(onMethod_ = @PropertyName("matching_job_estado"))
    private MatchingJobEstado matchingJobEstado;

    @Getter(onMethod_ = @PropertyName("matching_en_proceso_at"))
    @Setter(onMethod_ = @PropertyName("matching_en_proceso_at"))
    private Timestamp matchingEnProcesoAt;

    @Getter(onMethod_ = @PropertyName("matching_intentos"))
    @Setter(onMethod_ = @PropertyName("matching_intentos"))
    private Integer matchingIntentos;

    @Getter(onMethod_ = @PropertyName("score_conciliacion"))
    @Setter(onMethod_ = @PropertyName("score_conciliacion"))
    private Integer scoreConciliacion;

    @Getter(onMethod_ = @PropertyName("fecha_conciliacion"))
    @Setter(onMethod_ = @PropertyName("fecha_conciliacion"))
    private Timestamp fechaConciliacion;

    @Getter(onMethod_ = @PropertyName("agente_uuid"))
    @Setter(onMethod_ = @PropertyName("agente_uuid"))
    private String agenteUuid;

    @Getter(onMethod_ = @PropertyName("lote_origen_id"))
    @Setter(onMethod_ = @PropertyName("lote_origen_id"))
    private String loteOrigenId;

    @Getter(onMethod_ = @PropertyName("especificacion_esperada"))
    @Setter(onMethod_ = @PropertyName("especificacion_esperada"))
    private EspecificacionStock especificacionEsperada;

    @Getter(onMethod_ = @PropertyName("descripcion_stock"))
    @Setter(onMethod_ = @PropertyName("descripcion_stock"))
    private String descripcionStock;

    @Getter(onMethod_ = @PropertyName("serial_equipo"))
    @Setter(onMethod_ = @PropertyName("serial_equipo"))
    private String serialEquipo;

    @Getter(onMethod_ = @PropertyName("motherboard_serial"))
    @Setter(onMethod_ = @PropertyName("motherboard_serial"))
    private String motherboardSerial;

    @Getter(onMethod_ = @PropertyName("bios_uuid"))
    @Setter(onMethod_ = @PropertyName("bios_uuid"))
    private String biosUuid;

    @Getter(onMethod_ = @PropertyName("mac_principal"))
    @Setter(onMethod_ = @PropertyName("mac_principal"))
    private String macPrincipal;

    @Getter(onMethod_ = @PropertyName("asset_tag"))
    @Setter(onMethod_ = @PropertyName("asset_tag"))
    private String assetTag;

    public Computadora() {
        this.historialEstados = new ArrayList<>();
        this.discos = new ArrayList<>();
        this.modulos = new ArrayList<>();
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
        if (historialEstados != null) {
            for (CambioEstado cambio : historialEstados) {
                if (cambio.esEstadoActual()) {
                    return cambio.getEstado();
                }
            }
        }
        return estadoActual;
    }

}
