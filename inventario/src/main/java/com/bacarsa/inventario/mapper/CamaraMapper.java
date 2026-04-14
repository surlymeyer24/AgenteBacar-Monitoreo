package com.bacarsa.inventario.mapper;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.dto.CambioEstadoDTO;
import com.bacarsa.inventario.mapper.CambioEstadoMapper;
import java.util.List;


public class CamaraMapper {

    private CamaraMapper() {
        // Constructor privado para evitar instanciación
    }

    public static CamaraDTO toDTO(Camara camara) {
        if (camara == null) {
            return null;
        }
        CamaraDTO dto = new CamaraDTO();
        dto.setId(camara.getId());
        dto.setNombre(camara.getNombre());
        dto.setMarca(camara.getMarca());
        dto.setDescripcion(camara.getDescripcion());
        dto.setResponsable(camara.getResponsable());
        dto.setUbicacion(camara.getUbicacion() == null ? null : camara.getUbicacion().name());
        dto.setEstado(camara.getEstadoActual() == null ? null : camara.getEstadoActual().getNombre());
        dto.setFechaAlta(camara.getFechaAlta());
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(camara.getHistorialEstados()));
        return dto;
    }

}
