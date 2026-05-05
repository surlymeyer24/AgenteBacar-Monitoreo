package com.bacarsa.inventario.mapper;

import com.bacarsa.inventario.dto.UsuarioCreateDTO;
import com.bacarsa.inventario.dto.UsuarioDTO;
import com.bacarsa.inventario.models.Rol;
import com.bacarsa.inventario.models.Usuario;

public class UsuarioMapper {

    private UsuarioMapper() {}

    public static UsuarioDTO toDTO(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(usuario.getId());
        dto.setNombre(usuario.getNombre());
        dto.setEmail(usuario.getEmail());
        dto.setRol(usuario.getRol() == null ? null : usuario.getRol().name());
        dto.setActivo(usuario.isActivo());
        return dto;
    }

    public static Usuario toModel(UsuarioCreateDTO dto) {
        if (dto == null) {
            return null;
        }
        Usuario u = new Usuario();
        u.setId(dto.getUid());
        u.setNombre(dto.getNombre());
        u.setEmail(dto.getEmail());
        u.setRol(dto.getRol() == null ? null : Rol.valueOf(dto.getRol()));
        u.setActivo(true);
        return u;
    }

}
