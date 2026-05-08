package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerifericosAgenteListadosDTO {

    private List<UsbPerifericoConOrigenDTO> teclados;
    private List<UsbPerifericoConOrigenDTO> mouse;
    private List<UsbPerifericoConOrigenDTO> webcams;
    private List<AudioPerifericoConOrigenDTO> parlantes;
    private List<AudioPerifericoConOrigenDTO> microfonos;
}
