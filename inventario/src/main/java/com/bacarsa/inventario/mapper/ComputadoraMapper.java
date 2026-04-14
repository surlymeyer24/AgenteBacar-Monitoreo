package com.bacarsa.inventario.mapper;

import java.util.stream.Collectors;

import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.models.Computadora;
import com.google.cloud.Timestamp;




public class ComputadoraMapper {

    private ComputadoraMapper() {
        // Constructor privado para evitar instanciación
    }

    public static ComputadoraDTO toDTO(Computadora computadora) {
        return mapear(computadora, true);
    }

    public static ComputadoraDTO toListDTO(Computadora computadora) {
        return mapear(computadora, false);
    }

    private static ComputadoraDTO mapear(Computadora computadora, boolean incluirPerifericos) {
        if (computadora == null) {
            return null;
        }
        ComputadoraDTO dto = new ComputadoraDTO();
        dto.setUuid(computadora.getUuid());
        dto.setHostname(computadora.getHostname());
        dto.setUsuarioActual(computadora.getUsuarioActual());
        dto.setUbicacion(computadora.getUbicacion() == null ? null : computadora.getUbicacion().name());
        dto.setSistemaOperativo(computadora.getSistemaOperativo());
        dto.setArquitectura(computadora.getArquitectura());
        dto.setEstadoActual(computadora.getEstadoActual() == null ? null : computadora.getEstadoActual().getNombre());
        dto.setEstadoConexion(computadora.getEstadoConexion());
        dto.setEstadoAgente(mapearEstadoAgente(computadora.getEstadoConexion()));
        dto.setUltimaSincronizacion(formatUltimaSincronizacion(computadora.getUltimaSincronizacion()));
        dto.setProcesador(ProcesadorMapper.toDTO(
                computadora.getProcesadorRaw(),
                computadora.getNucleosFisicos(),
                computadora.getArquitectura()));
        dto.setDiscos(computadora.getDiscos().stream()
                .map(DiscoMapper::toDTO)
                .collect(Collectors.toList()));
        dto.setModulos(computadora.getModulos().stream()
                .map(RamMapper::toDTO)
                .collect(Collectors.toList()));
        if (incluirPerifericos) {
            dto.setPerifericos(PerifericosAgenteMapper.toDTO(computadora.getPerifericos()));
        }
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(computadora.getHistorialEstados()));
        return dto;
    }

    private static String formatUltimaSincronizacion(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return ts.toDate().toInstant().toString();
    }

    private static String mapearEstadoAgente(String estadoConexion) {
        if (estadoConexion == null || estadoConexion.isBlank()) {
            return "Desconectado";
        }
        return "ONLINE".equalsIgnoreCase(estadoConexion.trim()) ? "Activo" : "Desconectado";
    }
    

}
