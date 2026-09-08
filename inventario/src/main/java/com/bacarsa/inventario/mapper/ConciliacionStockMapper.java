package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.ConciliacionStockDTO;
import com.bacarsa.inventario.models.ConciliacionStock;
import com.bacarsa.inventario.models.DecisionConciliacion;
import com.bacarsa.inventario.models.OrigenConciliacion;
import com.google.cloud.Timestamp;

public final class ConciliacionStockMapper {

    private ConciliacionStockMapper() {
    }

    public static ConciliacionStockDTO toDTO(ConciliacionStock c) {
        if (c == null) {
            return null;
        }
        ConciliacionStockDTO dto = new ConciliacionStockDTO();
        dto.setId(c.getId());
        dto.setAgenteUuid(c.getAgenteUuid());
        dto.setCandidatoStockUuid(c.getCandidatoStockUuid());
        dto.setScore(c.getScore());
        dto.setCamposCoincidentes(c.getCamposCoincidentes());
        dto.setCamposDiferentes(c.getCamposDiferentes());
        dto.setNotasMatch(c.getNotasMatch());
        dto.setDecision(c.getDecision() != null ? c.getDecision().name() : null);
        dto.setUsuario(c.getUsuario());
        dto.setFecha(formatTs(c.getFecha()));
        dto.setOrigen(c.getOrigen() != null ? c.getOrigen().name() : null);
        dto.setSnapshotClave(c.getSnapshotClave());
        dto.setDetalleComparacion(c.getDetalleComparacion());
        dto.setPospuestoAt(formatTs(c.getPospuestoAt()));
        dto.setAgenteHostname(c.getAgenteHostname());
        dto.setStockHostname(c.getStockHostname());
        dto.setAgenteResumen(c.getAgenteResumen());
        dto.setStockResumen(c.getStockResumen());
        return dto;
    }

    public static ConciliacionStock toModel(ConciliacionStockDTO dto) {
        if (dto == null) {
            return null;
        }
        ConciliacionStock c = new ConciliacionStock();
        c.setId(dto.getId());
        c.setAgenteUuid(dto.getAgenteUuid());
        c.setCandidatoStockUuid(dto.getCandidatoStockUuid());
        c.setScore(dto.getScore());
        c.setCamposCoincidentes(dto.getCamposCoincidentes());
        c.setCamposDiferentes(dto.getCamposDiferentes());
        c.setNotasMatch(dto.getNotasMatch());
        if (dto.getDecision() != null) {
            c.setDecision(DecisionConciliacion.valueOf(dto.getDecision()));
        }
        c.setUsuario(dto.getUsuario());
        c.setOrigen(dto.getOrigen() != null ? OrigenConciliacion.valueOf(dto.getOrigen()) : null);
        c.setSnapshotClave(dto.getSnapshotClave());
        c.setDetalleComparacion(dto.getDetalleComparacion());
        c.setAgenteHostname(dto.getAgenteHostname());
        c.setStockHostname(dto.getStockHostname());
        c.setAgenteResumen(dto.getAgenteResumen());
        c.setStockResumen(dto.getStockResumen());
        return c;
    }

    private static String formatTs(Timestamp ts) {
        return ts != null ? ts.toDate().toInstant().toString() : null;
    }
}
