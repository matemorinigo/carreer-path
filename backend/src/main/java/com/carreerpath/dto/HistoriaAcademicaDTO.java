package com.carreerpath.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriaAcademicaDTO {

    private String codigo;
    private String nombre;
    private String origen;

    @JsonProperty("acta_resolucion")
    private String actaResolucion;

    private String fecha;
    private Integer nota;
}
