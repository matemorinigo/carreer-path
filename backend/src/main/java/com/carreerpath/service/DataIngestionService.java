package com.carreerpath.service;

import com.carreerpath.domain.Materia;
import com.carreerpath.dto.MateriaIngestionDTO;
import com.carreerpath.repository.MateriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio genérico e agnóstico de ingesta de planes de estudio.
 * Procesa JSON y persiste en tres fases:
 * 1. Guardar materias base
 * 2. Establecer correlatividades
 * 3. Establecer vínculos de materiaPadre
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DataIngestionService {

    private final MateriaRepository materiaRepository;

    /**
     * Realiza la ingesta completa de un plan de estudios desde JSON.
     *
     * @param materias Lista de MateriaIngestionDTO parseada desde JSON
     * @return mapa de resultados: materias ingresadas, errores, etc.
     */
    @Transactional
    public IngestionResult ingestar(List<MateriaIngestionDTO> materias) {
        log.info("Iniciando ingesta de {} materias", materias.size());
        IngestionResult resultado = new IngestionResult();

        try {
            // Fase 1: Guardar todas las materias como nodos básicos
            log.info("Fase 1: Guardando nodos básicos de materias");
            Map<String, Materia> materiasGuardadas = fase1GuardarMaterias(materias);
            resultado.setMateriasGuardadas(materiasGuardadas.size());

            // Fase 2: Establecer vínculos de correlatividad
            log.info("Fase 2: Estableciendo correlatividades");
            fase2EstablecerCorrelativas(materias, materiasGuardadas);

            // Fase 3: Establecer vínculos de materiaPadre
            log.info("Fase 3: Estableciendo materias padre");
            fase3EstablecerPadres(materias, materiasGuardadas);

            resultado.setExito(true);
            resultado.setMensaje("Ingesta completada exitosamente");
            log.info("Ingesta finalizada exitosamente");

        } catch (Exception e) {
            log.error("Error durante la ingesta", e);
            resultado.setExito(false);
            resultado.setMensaje("Error: " + e.getMessage());
            resultado.setError(e.getClass().getSimpleName());
        }

        return resultado;
    }

    /**
     * Fase 1: Guarda todas las materias como nodos básicos sin relaciones.
     */
    private Map<String, Materia> fase1GuardarMaterias(List<MateriaIngestionDTO> materias) {
        Map<String, Materia> mapa = new HashMap<>();

        for (MateriaIngestionDTO dto : materias) {
            if (dto.getId() == null || dto.getNombre() == null) {
                log.warn("Materia inválida (falta id o nombre), saltando: {}", dto);
                continue;
            }

            // Verificar si ya existe
            Optional<Materia> existe = materiaRepository.findById(dto.getId());
            if (existe.isPresent()) {
                log.warn("Materia {} ya existe, actualizando", dto.getId());
                mapa.put(dto.getId(), existe.get());
                continue;
            }

            Materia materia = Materia.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .esObligatoria(dto.isEsObligatoria())
                .anual(dto.isAnual())
                .esTransversal(dto.isEsTransversal())
                .horas(dto.getHoras())
                .correlativas(new HashSet<>())
                .build();

            Materia guardada = materiaRepository.save(materia);
            mapa.put(guardada.getId(), guardada);
            log.debug("Materia guardada: {}", guardada.getId());
        }

        return mapa;
    }

    /**
     * Fase 2: Establece los vínculos Many-to-Many de correlatividades.
     */
    private void fase2EstablecerCorrelativas(
        List<MateriaIngestionDTO> dtos,
        Map<String, Materia> materiasGuardadas
    ) {
        for (MateriaIngestionDTO dto : dtos) {
            Materia materia = materiasGuardadas.get(dto.getId());
            if (materia == null) continue;

            if (dto.getCorrelativas() != null && !dto.getCorrelativas().isEmpty()) {
                Set<Materia> correlativas = dto.getCorrelativas().stream()
                    .map(materiaId -> materiaRepository.findById(materiaId)
                        .orElseGet(() -> {
                            log.warn("Correlativa {} no encontrada para {}", materiaId, dto.getId());
                            return null;
                        }))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

                materia.setCorrelativas(correlativas);
                materiaRepository.save(materia);
                log.debug("Correlativas establecidas para {}: {}", dto.getId(), correlativas.size());
            }
        }
    }

    /**
     * Fase 3: Establece los vínculos Many-to-One de materiaPadre.
     */
    private void fase3EstablecerPadres(
        List<MateriaIngestionDTO> dtos,
        Map<String, Materia> materiasGuardadas
    ) {
        for (MateriaIngestionDTO dto : dtos) {
            Materia materia = materiasGuardadas.get(dto.getId());
            if (materia == null) continue;

            if (dto.getPadreId() != null && !dto.getPadreId().isEmpty()) {
                Optional<Materia> padre = materiaRepository.findById(dto.getPadreId());
                if (padre.isPresent()) {
                    materia.setMateriaPadre(padre.get());
                    materiaRepository.save(materia);
                    log.debug("Materia padre establecida para {}: {}", dto.getId(), dto.getPadreId());
                } else {
                    log.warn("Materia padre {} no encontrada para {}", dto.getPadreId(), dto.getId());
                }
            }
        }
    }

    /**
     * Clase auxiliar para almacenar resultados de la ingesta.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class IngestionResult {
        private boolean exito;
        private String mensaje;
        private Integer materiasGuardadas;
        private String error;
    }
}
