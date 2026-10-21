package com.bacarsa.inventario.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.models.MovimientoStock;
import com.bacarsa.inventario.models.TipoMovimiento;
import com.bacarsa.inventario.repository.MovimientoStockRepository;

@Service
public class AuditStockService {

    private static final Logger log = LoggerFactory.getLogger(AuditStockService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final MovimientoStockRepository movimientoStockRepository;

    public AuditStockService(MovimientoStockRepository movimientoStockRepository) {
        this.movimientoStockRepository = movimientoStockRepository;
    }

    public void registrar(RegistroAudit registro) {
        MovimientoStock m = new MovimientoStock();
        m.setId(UUID.randomUUID().toString());
        m.setTipoMovimiento(registro.tipoMovimiento().name());
        m.setPerifericoId(registro.perifericoId());
        m.setCodigo(registro.codigoInterno());
        m.setTipo(registro.tipoEquipo());
        m.setMarca(registro.marca());
        m.setModelo(registro.modelo());
        m.setSerieOImei(registro.serieOImei());
        m.setResponsable(registro.responsable());
        m.setArea(registro.area());
        m.setAccion(registro.tipoMovimiento().name());
        m.setEstado("Registrado");
        m.setFecha(registro.fecha() != null ? registro.fecha() : LocalDateTime.now().format(FMT));
        m.setMotivo(registro.motivo());
        m.setActorUid(registro.actorUid() != null ? registro.actorUid() : "SISTEMA");
        m.setComputadoraUuid(registro.computadoraUuid());
        m.setUbicacionOrigen(registro.ubicacionOrigen());
        m.setUbicacionDestino(registro.ubicacionDestino());
        m.setEstadoAnterior(registro.estadoAnterior());
        m.setEstadoNuevo(registro.estadoNuevo());

        try {
            movimientoStockRepository.save(m);
            log.info("Audit: {} periferico={} codigo={} actor={}",
                    registro.tipoMovimiento(), registro.perifericoId(),
                    registro.codigoInterno(), registro.actorUid());
        } catch (ExecutionException | InterruptedException e) {
            log.error("Audit: fallo al registrar {} para periferico={}",
                    registro.tipoMovimiento(), registro.perifericoId(), e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }
    }

    public record RegistroAudit(
            TipoMovimiento tipoMovimiento,
            String perifericoId,
            String codigoInterno,
            String tipoEquipo,
            String marca,
            String modelo,
            String serieOImei,
            String responsable,
            String area,
            String motivo,
            String actorUid,
            String fecha,
            String computadoraUuid,
            String ubicacionOrigen,
            String ubicacionDestino,
            String estadoAnterior,
            String estadoNuevo) {

        public static Builder builder(TipoMovimiento tipo, String perifericoId) {
            return new Builder(tipo, perifericoId);
        }

        public static final class Builder {
            private final TipoMovimiento tipoMovimiento;
            private final String perifericoId;
            private String codigoInterno;
            private String tipoEquipo;
            private String marca;
            private String modelo;
            private String serieOImei;
            private String responsable;
            private String area;
            private String motivo;
            private String actorUid;
            private String fecha;
            private String computadoraUuid;
            private String ubicacionOrigen;
            private String ubicacionDestino;
            private String estadoAnterior;
            private String estadoNuevo;

            private Builder(TipoMovimiento tipo, String perifericoId) {
                this.tipoMovimiento = tipo;
                this.perifericoId = perifericoId;
            }

            public Builder codigoInterno(String v) { this.codigoInterno = v; return this; }
            public Builder tipoEquipo(String v) { this.tipoEquipo = v; return this; }
            public Builder marca(String v) { this.marca = v; return this; }
            public Builder modelo(String v) { this.modelo = v; return this; }
            public Builder serieOImei(String v) { this.serieOImei = v; return this; }
            public Builder responsable(String v) { this.responsable = v; return this; }
            public Builder area(String v) { this.area = v; return this; }
            public Builder motivo(String v) { this.motivo = v; return this; }
            public Builder actorUid(String v) { this.actorUid = v; return this; }
            public Builder fecha(String v) { this.fecha = v; return this; }
            public Builder computadoraUuid(String v) { this.computadoraUuid = v; return this; }
            public Builder ubicacionOrigen(String v) { this.ubicacionOrigen = v; return this; }
            public Builder ubicacionDestino(String v) { this.ubicacionDestino = v; return this; }
            public Builder estadoAnterior(String v) { this.estadoAnterior = v; return this; }
            public Builder estadoNuevo(String v) { this.estadoNuevo = v; return this; }

            public RegistroAudit build() {
                return new RegistroAudit(
                        tipoMovimiento, perifericoId, codigoInterno,
                        tipoEquipo, marca, modelo, serieOImei,
                        responsable, area, motivo, actorUid, fecha,
                        computadoraUuid, ubicacionOrigen, ubicacionDestino,
                        estadoAnterior, estadoNuevo);
            }
        }
    }
}
