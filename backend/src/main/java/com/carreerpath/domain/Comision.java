package com.carreerpath.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comisiones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "materia")
@EqualsAndHashCode(of = "id")
public class Comision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "comision_id", nullable = false, length = 20)
    private String comisionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_id", nullable = false)
    private Materia materia;

    @Column(name = "sede", length = 100)
    private String sede;

    @Column(name = "modalidad", length = 100)
    private String modalidad;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "comision_horarios", joinColumns = @JoinColumn(name = "comision_pk"))
    @Builder.Default
    private List<Horario> horarios = new ArrayList<>();
}
