package com.bacarsa.inventario.mapper;
import com.bacarsa.inventario.dto.CamaraDTO;
import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.dto.CambioEstadoDTO;
import com.bacarsa.inventario.mapper.CambioEstadoMapper;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;


public class CamaraMapper {

    private CamaraMapper() {
        // Constructor privado para evitar instanciación
    }

    private static LocalDate parseFechaAltaIso(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(iso.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
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
        dto.setUbicacion(camara.getUbicacion());
        dto.setDireccionIp(camara.getDireccionIp());
        dto.setPuerto(camara.getPuerto());
        dto.setTipo(camara.getTipo());
        dto.setEstado(camara.getEstadoActual() == null ? null : camara.getEstadoActual().getNombre());
        dto.setFechaAlta(parseFechaAltaIso(camara.getFechaAlta()));
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(camara.getHistorialEstados()));
        dto.setNvrId(camara.getNvrId());
        dto.setUsuario(camara.getUsuario());
        dto.setPassword(camara.getPassword());
        return dto;
    }

}
