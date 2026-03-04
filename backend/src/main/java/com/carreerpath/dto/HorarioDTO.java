package com.carreerpath.dto;

import com.carreerpath.domain.Horario;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorarioDTO {

    private String dia;
    private String horaInicio;
    private String horaFin;

    public static HorarioDTO fromDomain(Horario horario) {
        return HorarioDTO.builder()
            .dia(horario.getDia())
            .horaInicio(horario.getHoraInicio() != null ? horario.getHoraInicio().toString() : null)
            .horaFin(horario.getHoraFin() != null ? horario.getHoraFin().toString() : null)
            .build();
    }
}
