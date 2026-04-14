package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.ProcesadorDTO;
import com.bacarsa.inventario.models.FabricanteProcesador;
import com.bacarsa.inventario.models.Procesador;

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

    // Construye el DTO directamente desde los datos aplanados del documento de Firestore
    // (la entidad Computadora guarda procesador como String + nucleos_fisicos + arquitectura).
    public static ProcesadorDTO toDTO(String nombreRaw, int nucleosFisicos, String arquitectura) {
        if (nombreRaw == null) {
            return null;
        }
        ProcesadorDTO dto = new ProcesadorDTO();
        dto.setNombreRaw(nombreRaw);
        dto.setNucleosFisicos(nucleosFisicos);
        dto.setArquitectura(arquitectura);
        dto.setFabricante(FabricanteProcesador.fromString(nombreRaw));
        return dto;
    }
}
