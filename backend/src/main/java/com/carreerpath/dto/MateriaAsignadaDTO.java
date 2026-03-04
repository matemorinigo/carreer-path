package com.carreerpath.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MateriaAsignadaDTO {

    private String materiaId;
    private String nombre;
    private String comisionId;
    private String sede;
    private String modalidad;
    private List<HorarioDTO> horarios;
    private boolean sinOferta;
    private boolean anual;
    private boolean estimado;
}
