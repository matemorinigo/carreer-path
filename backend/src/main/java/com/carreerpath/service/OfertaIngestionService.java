package com.carreerpath.service;

import com.carreerpath.domain.Comision;
import com.carreerpath.domain.Horario;
import com.carreerpath.domain.Materia;
import com.carreerpath.dto.HistoriaAcademicaDTO;
import com.carreerpath.dto.OfertaMateriaDTO;
import com.carreerpath.repository.ComisionRepository;
import com.carreerpath.repository.MateriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OfertaIngestionService {

    private final MateriaRepository materiaRepository;
    private final ComisionRepository comisionRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public IngestionResult ingestarOferta(List<OfertaMateriaDTO> oferta) {
        log.info("Iniciando ingesta de oferta: {} materias con comisiones", oferta.size());
        int comisionesCreadas = 0;
        int materiasNoEncontradas = 0;
        List<String> warnings = new ArrayList<>();

        for (OfertaMateriaDTO dto : oferta) {
            String materiaId = normalizeId(dto.getCodigoMateria());
            Optional<Materia> materiaOpt = materiaRepository.findById(materiaId);

            if (materiaOpt.isEmpty()) {
                warnings.add("Materia " + dto.getCodigoMateria() + " (" + dto.getNombre() + ") no encontrada en el plan");
                materiasNoEncontradas++;
                continue;
            }

            Materia materia = materiaOpt.get();

            comisionRepository.deleteByMateriaId(materia.getId());

            if (dto.getComisiones() == null) continue;

            for (OfertaMateriaDTO.ComisionDTO comDto : dto.getComisiones()) {
                List<Horario> horarios = new ArrayList<>();
                if (comDto.getHorarios() != null) {
                    for (OfertaMateriaDTO.HorarioDTO hDto : comDto.getHorarios()) {
                        horarios.add(Horario.builder()
                            .dia(hDto.getDia())
                            .horaInicio(parseTime(hDto.getInicio()))
                            .horaFin(parseTime(hDto.getFin()))
                            .build());
                    }
                }

                Comision comision = Comision.builder()
                    .comisionId(comDto.getId())
                    .materia(materia)
                    .sede(comDto.getSede())
                    .modalidad(comDto.getModalidad())
                    .horarios(horarios)
                    .build();

                comisionRepository.save(comision);
                comisionesCreadas++;
            }
        }

        log.info("Ingesta de oferta completada: {} comisiones creadas, {} materias no encontradas",
            comisionesCreadas, materiasNoEncontradas);

        return new IngestionResult(true,
            "Oferta ingresada: " + comisionesCreadas + " comisiones",
            comisionesCreadas, warnings);
    }

    @Transactional
    public IngestionResult ingestarHistoria(List<HistoriaAcademicaDTO> historia) {
        log.info("Iniciando ingesta de historia académica: {} registros", historia.size());
        int materiasActualizadas = 0;
        List<String> warnings = new ArrayList<>();

        for (HistoriaAcademicaDTO dto : historia) {
            String materiaId = normalizeId(dto.getCodigo());
            Optional<Materia> materiaOpt = materiaRepository.findById(materiaId);

            if (materiaOpt.isEmpty()) {
                warnings.add("Materia " + dto.getCodigo() + " (" + dto.getNombre() + ") no encontrada en el plan");
                continue;
            }

            Materia materia = materiaOpt.get();
            if (!materia.isAprobada()) {
                materia.setAprobada(true);
                materiaRepository.save(materia);
                materiasActualizadas++;
                log.debug("Materia {} marcada como aprobada", materiaId);
            }
        }

        log.info("Historia académica procesada: {} materias marcadas como aprobadas", materiasActualizadas);

        return new IngestionResult(true,
            "Historia procesada: " + materiasActualizadas + " materias aprobadas",
            materiasActualizadas, warnings);
    }

    private LocalTime parseTime(String time) {
        if (time == null || time.isBlank()) return null;
        try {
            return LocalTime.parse(time, TIME_FMT);
        } catch (Exception e) {
            log.warn("No se pudo parsear hora: {}", time);
            return null;
        }
    }

    static String normalizeId(String id) {
        if (id == null) return null;
        String normalized = id.replaceFirst("^0+", "");
        return normalized.isEmpty() ? "0" : normalized;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class IngestionResult {
        private boolean exito;
        private String mensaje;
        private int registrosProcesados;
        private List<String> warnings;
    }
}
