package com.carreerpath.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuatrimestreDTO {

    private int numero;
    private List<MateriaAsignadaDTO> materias;
}
