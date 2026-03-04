package com.carreerpath.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanOptimoDTO {

    private int totalCuatrimestres;
    private int materiasCompletadas;
    private int materiasPendientes;
    private List<CuatrimestreDTO> cuatrimestres;
}
