package com.bacarsa.inventario.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.bacarsa.inventario.dto.BaselineEsperadoDTO;
import com.bacarsa.inventario.dto.BaselinePerifericoEsperadoDTO;
import com.bacarsa.inventario.models.BaselineEsperado;
import com.bacarsa.inventario.models.BaselinePerifericoEsperado;
import com.google.cloud.Timestamp;

public final class BaselineEsperadoMapper {

    private BaselineEsperadoMapper() {
    }

    public static BaselineEsperadoDTO toDTO(BaselineEsperado baseline) {
        if (baseline == null) {
            return null;
        }
        BaselineEsperadoDTO dto = new BaselineEsperadoDTO();
        dto.setCpuModelo(baseline.getCpuModelo());
        dto.setRamTotalGb(baseline.getRamTotalGb());
        dto.setDiscoResumen(baseline.getDiscoResumen());
        dto.setArmadoPor(baseline.getArmadoPor());
        Timestamp armadoAt = baseline.getArmadoAt();
        dto.setArmadoAt(armadoAt != null ? armadoAt.toDate().toInstant().toString() : null);
        if (baseline.getPerifericos() != null) {
            dto.setPerifericos(baseline.getPerifericos().stream()
                    .map(BaselineEsperadoMapper::toPerifericoDTO)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private static BaselinePerifericoEsperadoDTO toPerifericoDTO(BaselinePerifericoEsperado p) {
        if (p == null) {
            return null;
        }
        BaselinePerifericoEsperadoDTO dto = new BaselinePerifericoEsperadoDTO();
        dto.setTipo(p.getTipo());
        dto.setIdStock(p.getIdStock());
        dto.setNombre(p.getNombre());
        dto.setFabricante(p.getFabricante());
        dto.setNumeroSerie(p.getNumeroSerie());
        return dto;
    }

    public static BaselineEsperado toModel(BaselineEsperadoDTO dto) {
        if (dto == null) {
            return null;
        }
        BaselineEsperado baseline = new BaselineEsperado();
        baseline.setCpuModelo(dto.getCpuModelo());
        baseline.setRamTotalGb(dto.getRamTotalGb());
        baseline.setDiscoResumen(dto.getDiscoResumen());
        baseline.setArmadoPor(dto.getArmadoPor());
        if (dto.getPerifericos() != null) {
            List<BaselinePerifericoEsperado> perifs = dto.getPerifericos().stream()
                    .map(BaselineEsperadoMapper::toPerifericoModel)
                    .collect(Collectors.toList());
            baseline.setPerifericos(perifs);
        }
        return baseline;
    }

    private static BaselinePerifericoEsperado toPerifericoModel(BaselinePerifericoEsperadoDTO dto) {
        if (dto == null) {
            return null;
        }
        BaselinePerifericoEsperado p = new BaselinePerifericoEsperado();
        p.setTipo(dto.getTipo());
        p.setIdStock(dto.getIdStock());
        p.setNombre(dto.getNombre());
        p.setFabricante(dto.getFabricante());
        p.setNumeroSerie(dto.getNumeroSerie());
        return p;
    }
}
