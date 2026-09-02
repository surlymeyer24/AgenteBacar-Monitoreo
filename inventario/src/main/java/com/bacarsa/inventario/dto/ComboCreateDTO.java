package com.bacarsa.inventario.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComboCreateDTO {

    @NotBlank
    private String comboNombre;

    @NotEmpty
    @Valid
    private List<PerifericoManualCreateDTO> items;
}
