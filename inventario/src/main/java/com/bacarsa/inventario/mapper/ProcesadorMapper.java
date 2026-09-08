package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.ProcesadorDTO;
import com.bacarsa.inventario.models.FabricanteProcesador;
import com.bacarsa.inventario.models.Procesador;
import com.bacarsa.inventario.models.ProcesadorDetallado;

public class ProcesadorMapper {

    private ProcesadorMapper() {}

    public static ProcesadorDTO toDTO(Procesador procesador) {
        if (procesador == null) {
            return null;
        }
        ProcesadorDTO dto = new ProcesadorDTO();
        dto.setNombreRaw(procesador.getNombreRaw());
        dto.setNucleosFisicos(procesador.getNucleosFisicos());
        dto.setArquitectura(procesador.getArquitectura());
        dto.setFabricante(procesador.getFabricante());
        return dto;
    }

    public static ProcesadorDTO toDTO(String nombreRaw, int nucleosFisicos, String arquitectura,
                                      ProcesadorDetallado detallado) {
        if (nombreRaw == null && detallado == null) {
            return null;
        }
        ProcesadorDTO dto = new ProcesadorDTO();
        String nombre = nombreRaw;
        if ((nombre == null || nombre.isBlank()) && detallado != null) {
            nombre = detallado.getNombreCompleto();
        }
        dto.setNombreRaw(nombre);
        dto.setNucleosFisicos(nucleosFisicos);
        if (detallado != null && detallado.getNucleosFisicos() != null && detallado.getNucleosFisicos() > 0) {
            dto.setNucleosFisicos(detallado.getNucleosFisicos());
        }
        dto.setArquitectura(arquitectura);
        dto.setFabricante(FabricanteProcesador.fromString(nombre));
        if (detallado != null) {
            dto.setDetallado(ProcesadorDetalladoMapper.toDTO(detallado));
            if (detallado.getFabricante() != null && !detallado.getFabricante().isBlank()) {
                dto.setFabricante(FabricanteProcesador.fromString(detallado.getFabricante()));
            }
            dto.setGama(detallado.getGama());
            dto.setModelo(detallado.getModelo());
            dto.setGeneracion(detallado.getGeneracion());
            if (detallado.getNucleosLogicos() != null) {
                dto.setNucleosLogicos(detallado.getNucleosLogicos());
            }
            dto.setFrecuenciaMaxMhz(detallado.getFrecuenciaMaxMhz());
        }
        return dto;
    }

    // Compatibilidad con llamadas existentes sin detalle del agente.
    public static ProcesadorDTO toDTO(String nombreRaw, int nucleosFisicos, String arquitectura) {
        return toDTO(nombreRaw, nucleosFisicos, arquitectura, null);
    }
}
