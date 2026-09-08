package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.CatalogoItemCreateDTO;
import com.bacarsa.inventario.dto.CatalogoItemDTO;
import com.bacarsa.inventario.models.CatalogoItem;

public class CatalogoItemMapper {

    private CatalogoItemMapper() {}

    public static CatalogoItemDTO toDTO(CatalogoItem item) {
        if (item == null) {
            return null;
        }
        CatalogoItemDTO dto = new CatalogoItemDTO();
        dto.setId(item.getId());
        dto.setCatalogo(item.getCatalogo());
        dto.setCodigo(item.getCodigo());
        dto.setLabel(item.getLabel());
        dto.setActivo(item.isActivo());
        dto.setOrden(item.getOrden());
        dto.setIcono(item.getIcono());
        return dto;
    }

    public static CatalogoItem toModel(String catalogo, CatalogoItemCreateDTO dto) {
        if (dto == null) {
            return null;
        }
        CatalogoItem item = new CatalogoItem();
        item.setCatalogo(catalogo);
        item.setCodigo(dto.getCodigo().trim().toLowerCase());
        item.setId(catalogo + "_" + item.getCodigo());
        item.setLabel(dto.getLabel().trim());
        item.setActivo(true);
        item.setIcono(dto.getIcono());
        return item;
    }
}
