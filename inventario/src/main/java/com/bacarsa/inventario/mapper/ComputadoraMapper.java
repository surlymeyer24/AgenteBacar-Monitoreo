package com.bacarsa.inventario.mapper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.bacarsa.inventario.dto.ComputadoraDTO;
import com.bacarsa.inventario.models.Computadora;
import com.bacarsa.inventario.models.EstadoOperativo;
import com.bacarsa.inventario.util.FirestoreJsonHelper;
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
        dto.setTipoEquipo(computadora.getTipoEquipo() != null ? computadora.getTipoEquipo().getTipo() : null);
        dto.setUsuarioActual(computadora.getUsuarioActual());
        dto.setUbicacion(computadora.getUbicacion() == null ? null : computadora.getUbicacion().name());
        dto.setSistemaOperativo(computadora.getSistemaOperativo());
        dto.setArquitectura(computadora.getArquitectura());
        if (computadora.getEstadoActual() != null) {
            dto.setEstadoActual(computadora.getEstadoActual().getNombre());
        } else {
            dto.setEstadoActual(
                EstadoOperativo.inferirAsignacionDesdeTexto(computadora.getUsuarioActual()).getNombre()
            );
        }
        dto.setEstadoConexion(computadora.getEstadoConexion());
        dto.setEstadoAgente(mapearEstadoAgente(computadora.getEstadoConexion()));
        dto.setUltimaSincronizacion(formatUltimaSincronizacion(computadora.getUltimaSincronizacion()));
        dto.setProcesador(ProcesadorMapper.toDTO(
                computadora.getProcesadorRaw(),
                computadora.getNucleosFisicos(),
                computadora.getArquitectura(),
                computadora.getProcesadorDetallado()));
        dto.setRamPlaca(RamPlacaMapper.toDTO(computadora.getRamPlaca()));
        dto.setRamTotalGb(computadora.getRamTotalGb());
        dto.setCpuUsoPorcentaje(computadora.getCpuUsoPorcentaje());
        dto.setRamUsoPorcentaje(computadora.getRamUsoPorcentaje());
        dto.setDiscos(computadora.getDiscos() == null
                ? List.of()
                : computadora.getDiscos().stream()
                        .map(DiscoMapper::toDTO)
                        .collect(Collectors.toList()));
        dto.setModulos(computadora.getModulos() == null
                ? List.of()
                : computadora.getModulos().stream()
                        .map(RamMapper::toDTO)
                        .collect(Collectors.toList()));
        if (incluirPerifericos) {
            dto.setPerifericos(PerifericosAgenteMapper.toDTO(computadora.getPerifericos()));
            Map<String, Object> winVer = computadora.getWindowsVersionDetallada();
            if (winVer != null && !winVer.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> saneado = (Map<String, Object>) FirestoreJsonHelper.toJsonFriendly(winVer);
                dto.setWindowsVersionDetallada(saneado);
            }
        }
        dto.setHistorialEstados(CambioEstadoMapper.toDTOList(computadora.getHistorialEstados()));
        dto.setResponsableInventario(computadora.getResponsableInventario());
        dto.setAnydeskId(computadora.getAnydeskId());
        dto.setCondicion(computadora.getCondicion());
        dto.setOrigenAlta(computadora.getOrigenAlta() != null ? computadora.getOrigenAlta().name() : null);
        dto.setEstadoConciliacion(computadora.getEstadoConciliacion() != null ? computadora.getEstadoConciliacion().name() : null);
        dto.setBaselineEsperado(BaselineEsperadoMapper.toDTO(computadora.getBaselineEsperado()));
        dto.setComboEsperadoId(computadora.getComboEsperadoId());
        dto.setPrimerReporteAgenteAt(formatUltimaSincronizacion(computadora.getPrimerReporteAgenteAt()));
        dto.setMatchingJobEstado(computadora.getMatchingJobEstado() != null ? computadora.getMatchingJobEstado().name() : null);
        dto.setScoreConciliacion(computadora.getScoreConciliacion());
        dto.setFechaConciliacion(formatUltimaSincronizacion(computadora.getFechaConciliacion()));
        dto.setAgenteUuid(computadora.getAgenteUuid());
        dto.setLoteOrigenId(computadora.getLoteOrigenId());
        dto.setEspecificacionEsperada(EspecificacionStockMapper.toDTO(computadora.getEspecificacionEsperada()));
        dto.setUbicacionStock(extraerUbicacionStockVigente(computadora));
        return dto;
    }

    private static String extraerUbicacionStockVigente(Computadora computadora) {
        if (computadora.getHistorialEstados() != null) {
            for (int i = computadora.getHistorialEstados().size() - 1; i >= 0; i--) {
                var cambio = computadora.getHistorialEstados().get(i);
                if (cambio != null && cambio.esEstadoActual() && cambio.getUbicacionStock() != null
                        && !cambio.getUbicacionStock().isBlank()) {
                    return cambio.getUbicacionStock();
                }
            }
        }
        return null;
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
