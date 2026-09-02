package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.CelularDTO;
import com.bacarsa.inventario.models.Celular;

public class CelularMapper {

    private CelularMapper() {}

    public static CelularDTO toDTO(Celular celular) {
        if (celular == null) {
            return null;
        }
        CelularDTO dto = new CelularDTO();
        dto.setId(celular.getId());
        dto.setMarca(celular.getMarca());
        dto.setModelo(celular.getModelo());
        dto.setImei(celular.getImei());
        dto.setLineaNumero(celular.getLineaNumero());
        dto.setResponsable(celular.getResponsable());
        dto.setArea(celular.getArea());
        dto.setEstado(celular.getEstado());
        return dto;
    }
}
