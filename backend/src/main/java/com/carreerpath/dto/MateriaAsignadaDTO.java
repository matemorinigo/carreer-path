package com.carreerpath.dto;

import lombok.*;

import java.util.ArrayList;
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
    private boolean electiva;
    private boolean anual;
    private boolean estimado;
    private String conflictoCon;
    private String ofertaFueraDeTurno;

    /**
     * Materias con las que ésta es intercambiable: chocan de horario pero ninguna
     * bloquea correlativas, así que se pueden cambiar de cuatrimestre entre sí sin
     * afectar el resto del plan.
     */
    private List<MateriaIntercambiableDTO> intercambiables;

    public void addIntercambiable(MateriaIntercambiableDTO intercambiable) {
        if (intercambiables == null) intercambiables = new ArrayList<>();
        intercambiables.add(intercambiable);
    }
}
