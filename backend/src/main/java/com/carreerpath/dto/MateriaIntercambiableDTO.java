package com.carreerpath.dto;

import lombok.*;

/**
 * Referencia a una materia con la que otra es intercambiable: chocan de horario
 * pero ninguna de las dos bloquea correlativas a futuro, así que el orden en que
 * se cursan es libre y el usuario puede cambiarlas de cuatrimestre entre sí.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MateriaIntercambiableDTO {

    private String materiaId;
    private String nombre;
    private int cuatrimestre;
}
