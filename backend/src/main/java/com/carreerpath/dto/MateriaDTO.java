package com.carreerpath.dto;

import com.carreerpath.domain.Materia;
import lombok.*;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * DTO simple para Materia sin ciclos infinitos.
 * Incluye solo IDs de correlativas, no las entidades completas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MateriaDTO {
    private String id;
    private String nombre;
    private boolean esObligatoria;
    private boolean anual;
    private Integer horas;
    private boolean aprobada;
    private String materiaPadreId;
    private Set<String> correlativasIds;

    public static MateriaDTO fromEntity(Materia materia) {
        return MateriaDTO.builder()
            .id(materia.getId())
            .nombre(materia.getNombre())
            .esObligatoria(materia.isEsObligatoria())
            .anual(materia.isAnual())
            .horas(materia.getHoras())
            .aprobada(materia.isAprobada())
            .materiaPadreId(materia.getMateriaPadre() != null ? materia.getMateriaPadre().getId() : null)
            .correlativasIds(materia.getCorrelativas().stream()
                .map(Materia::getId)
                .collect(Collectors.toSet()))
            .build();
    }

    public static Materia toEntity(MateriaDTO dto) {
        return Materia.builder()
            .id(dto.getId())
            .nombre(dto.getNombre())
            .esObligatoria(dto.isEsObligatoria())
            .anual(dto.isAnual())
            .horas(dto.getHoras())
            .aprobada(dto.isAprobada())
            .build();
    }
}
