package com.carreerpath.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "materias")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Materia {

    @Id
    @Column(name = "id", nullable = false, length = 50)
    private String id;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "es_obligatoria", nullable = false)
    private boolean esObligatoria;

    @Column(name = "horas", nullable = false)
    private Integer horas;

    @Column(name = "anual", nullable = false)
    @Builder.Default
    private boolean anual = false;

    @Column(name = "es_transversal", nullable = false)
    @Builder.Default
    private boolean esTransversal = false;

    @Column(name = "aprobada", nullable = false)
    @Builder.Default
    private boolean aprobada = false;

    // Many-to-One: una materia puede tener una materiaPadre (ej: Electiva III)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_padre_id", referencedColumnName = "id")
    private Materia materiaPadre;

    // Many-to-Many: correlatividades
    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinTable(
        name = "materia_correlativas",
        joinColumns = @JoinColumn(name = "materia_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "correlativa_id", referencedColumnName = "id")
    )
    @Builder.Default
    private Set<Materia> correlativas = new HashSet<>();
}
