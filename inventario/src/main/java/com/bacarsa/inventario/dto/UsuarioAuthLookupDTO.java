package com.bacarsa.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioAuthLookupDTO {

    private String uid;
    private String email;
    private String displayName;
    private boolean yaRegistrado;

}
