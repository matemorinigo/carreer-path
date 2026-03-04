package com.carreerpath.dto;

import lombok.*;

import java.util.List;

/**
 * DTO para ingesta de plan de estudios desde JSON.
 * Campos opcionales: esObligatoria (default false), padreId, correlativas
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MateriaIngestionDTO {
    private String id;
    private String nombre;
    private Integer horas;
    private boolean esObligatoria;
    private boolean anual;
    private boolean esTransversal;
    private String padreId;
    private List<String> correlativas;
}
