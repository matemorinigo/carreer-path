package com.carreerpath.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerarPlanRequestDTO {

    private List<HistoriaAcademicaDTO> historia;

    @Builder.Default
    private int maxMaterias = 5;

    @Builder.Default
    private List<String> turnos = List.of("manana", "tarde", "noche");

    private List<OfertaMateriaDTO> ofertaCustom;
}
