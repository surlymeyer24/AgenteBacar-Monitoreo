package com.bacarsa.inventario.dto;

import com.bacarsa.inventario.dto.AudioAgenteDTO;
import com.bacarsa.inventario.dto.DispositivoUsbAgenteDTO;
import com.bacarsa.inventario.dto.ImpresoraAgenteDTO;
import com.bacarsa.inventario.dto.MonitorAgenteDTO;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PerifericoAgenteDTO {

    private List<ImpresoraAgenteDTO> impresoras;
    private List<DispositivoUsbAgenteDTO> dispositivosUsb;
    private List<MonitorAgenteDTO> monitores;
    private AudioAgenteDTO audio;
    }
