package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.PerifericoDTO;
import com.bacarsa.inventario.models.Periferico;

public class PerifericoMapper {

    private PerifericoMapper() {
    // Evitar instanciación
    }

    public static PerifericoDTO toDTO(Periferico periferico) {
        if (periferico == null) {
            return null;
        }
        PerifericoDTO dto = new PerifericoDTO();
        dto.setId(periferico.getId());
        dto.setNombre(periferico.getNombre());
        dto.setMarca(periferico.getMarca());
        dto.setTipo(periferico.getTipo());
        // si el periferico esta asignado, obtiene el UUID de la pc, sino queda en null
        dto.setComputadoraUuid(periferico.getComputadora() != null ? periferico.getComputadora().getUuid() : null);
        return dto;
    }


}
