package com.carreerpath.service;

import com.carreerpath.domain.Materia;
import com.carreerpath.dto.MateriaDTO;
import com.carreerpath.repository.ComisionRepository;
import com.carreerpath.repository.MateriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MateriaService {

    private final MateriaRepository materiaRepository;
    private final ComisionRepository comisionRepository;

    /**
     * Obtiene todas las materias.
     */
    @Transactional(readOnly = true)
    public List<MateriaDTO> obtenerTodas() {
        return materiaRepository.findAll().stream()
            .map(MateriaDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene una materia por ID.
     */
    @Transactional(readOnly = true)
    public Optional<MateriaDTO> obtenerPorId(String id) {
        return materiaRepository.findById(id)
            .map(MateriaDTO::fromEntity);
    }

    /**
     * Obtiene todas las materias obligatorias.
     */
    @Transactional(readOnly = true)
    public List<MateriaDTO> obtenerObligatorias() {
        return materiaRepository.findByEsObligatoria(true).stream()
            .map(MateriaDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las materias optativas (no obligatorias).
     */
    @Transactional(readOnly = true)
    public List<MateriaDTO> obtenerOptativas() {
        return materiaRepository.findByEsObligatoria(false).stream()
            .map(MateriaDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene las materias hijas de una materia padre.
     */
    @Transactional(readOnly = true)
    public List<MateriaDTO> obtenerHijas(String materiaPadreId) {
        return materiaRepository.findByMateriaPadreId(materiaPadreId).stream()
            .map(MateriaDTO::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Elimina todas las materias (útil para clean ingesta).
     */
    @Transactional
    public void eliminarTodas() {
        log.info("Eliminando todas las comisiones y materias");
        comisionRepository.deleteAll();
        materiaRepository.deleteAll();
    }

    /**
     * Obtiene información estadística del plan.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadisticas() {
        List<Materia> todas = materiaRepository.findAll();
        List<Materia> obligatorias = materiaRepository.findByEsObligatoria(true);
        List<Materia> optativas = materiaRepository.findByEsObligatoria(false);

        return Map.of(
            "total", todas.size(),
            "obligatorias", obligatorias.size(),
            "optativas", optativas.size(),
            "horasTotal", todas.stream()
                .mapToInt(m -> m.getHoras() != null ? m.getHoras() : 0)
                .sum()
        );
    }
}
