package com.carreerpath.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfertaMateriaDTO {

    @JsonProperty("codigo_materia")
    private String codigoMateria;

    private String nombre;

    private List<ComisionDTO> comisiones;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComisionDTO {
        private String id;
        private List<HorarioDTO> horarios;
        private String sede;
        private String modalidad;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HorarioDTO {
        private String dia;
        private String inicio;
        private String fin;
    }
}
