package com.bacarsa.inventario.dto;
import com.bacarsa.inventario.models.Nvr;

public class NvrMapper {

    public static NvrDTO toDTO(Nvr nvr) {
        if (nvr == null) return null;
        return new NvrDTO(
                nvr.getId(),
                nvr.getNombre(),
                nvr.getDireccionIp(),
                nvr.getPuerto(),
                nvr.getDescripcion(),
                null,
                null
        );
    }

}
