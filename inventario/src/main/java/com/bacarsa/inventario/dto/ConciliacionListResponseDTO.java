package com.bacarsa.inventario.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConciliacionListResponseDTO {
    private List<ConciliacionStockDTO> items;
    private long total;
    private int limit;
    private int offset;
}
