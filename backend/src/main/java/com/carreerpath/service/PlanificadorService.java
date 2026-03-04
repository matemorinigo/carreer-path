package com.carreerpath.service;

import com.carreerpath.domain.Comision;
import com.carreerpath.domain.Horario;
import com.carreerpath.domain.Materia;
import com.carreerpath.dto.*;
import com.carreerpath.repository.ComisionRepository;
import com.carreerpath.repository.MateriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlanificadorService {

    private final MateriaRepository materiaRepository;
    private final ComisionRepository comisionRepository;

    private static final int MAX_CUATRIMESTRES = 30;

    @Transactional(readOnly = true)
    public PlanOptimoDTO generarPlanConHistoria(List<HistoriaAcademicaDTO> historia, int maxMaterias) {
        return generarPlanOptimo(maxMaterias, historia);
    }

    @Transactional(readOnly = true)
    public PlanOptimoDTO generarPlanOptimo(int maxMateriasPorCuatrimestre, List<HistoriaAcademicaDTO> historia) {
        List<Materia> todasMaterias = materiaRepository.findAll();
        Map<String, Materia> materiaMap = todasMaterias.stream()
            .collect(Collectors.toMap(Materia::getId, Function.identity()));

        // --- Paso A: Grafo de dependencias y pesos ---
        Map<String, Set<String>> reverseDeps = buildReverseDependencyGraph(todasMaterias);
        Map<String, Integer> pesoDependencia = computeDependencyWeights(todasMaterias, reverseDeps);

        log.info("Pesos de dependencia calculados para {} materias", pesoDependencia.size());
        pesoDependencia.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10)
            .forEach(e -> log.debug("  {} ({}): peso={}", materiaMap.get(e.getKey()).getNombre(), e.getKey(), e.getValue()));

        Map<String, List<Comision>> comisionesPorMateria = comisionRepository.findAll().stream()
            .collect(Collectors.groupingBy(c -> c.getMateria().getId()));

        Set<String> aprobadasIds = buildAprobadasFromHistoria(historia);

        Set<String> completadas = todasMaterias.stream()
            .filter(m -> aprobadasIds.contains(m.getId()))
            .map(Materia::getId)
            .collect(Collectors.toCollection(HashSet::new));

        int materiasYaAprobadas = completadas.size();

        Set<String> pendientes = todasMaterias.stream()
            .filter(m -> !completadas.contains(m.getId()) && m.isEsObligatoria())
            .map(Materia::getId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        log.info("Estado inicial: {} aprobadas, {} pendientes (obligatorias)", completadas.size(), pendientes.size());

        // --- Paso E: Iteración cuatrimestre a cuatrimestre ---
        List<CuatrimestreDTO> cuatrimestres = new ArrayList<>();
        int numCuatrimestre = 1;
        boolean primerCuatrimestre = true;
        Set<String> materiasAnualesEnCurso = new HashSet<>();

        while ((!pendientes.isEmpty() || !materiasAnualesEnCurso.isEmpty()) && numCuatrimestre <= MAX_CUATRIMESTRES) {
            boolean esPrimerCuatrimestreDelAnio = numCuatrimestre % 2 == 1;

            List<MateriaAsignadaDTO> asignadas = new ArrayList<>();
            List<Horario> horariosOcupados = new ArrayList<>();
            Set<String> slotsResueltos = new HashSet<>();

            // Materias anuales en curso se continúan en este cuatrimestre
            Set<String> anualesCompletandose = new HashSet<>();
            if (!esPrimerCuatrimestreDelAnio && !materiasAnualesEnCurso.isEmpty()) {
                for (String anualId : materiasAnualesEnCurso) {
                    Materia m = materiaMap.get(anualId);
                    asignadas.add(MateriaAsignadaDTO.builder()
                        .materiaId(m.getId())
                        .nombre(m.getNombre())
                        .sinOferta(true)
                        .anual(true)
                        .build());
                    anualesCompletandose.add(anualId);
                }
            }

            // --- Paso B: Filtrar materias cursables ---
            List<String> cursables = pendientes.stream()
                .filter(id -> {
                    Materia m = materiaMap.get(id);
                    if (m == null) return false;
                    if (m.getMateriaPadre() != null) return false;
                    if (m.isAnual() && !esPrimerCuatrimestreDelAnio) return false;
                    boolean correlativasPropiasCumplidas = m.getCorrelativas().stream()
                        .allMatch(c -> completadas.contains(c.getId()));
                    if (!correlativasPropiasCumplidas) return false;
                    if (tieneHijas(m, materiaMap)) {
                        return tieneHijaCursable(m, materiaMap, completadas);
                    }
                    return true;
                })
                .collect(Collectors.toList());

            if (cursables.isEmpty() && asignadas.isEmpty()) {
                log.warn("Sin materias cursables. Quedan {} pendientes (posibles correlativas circulares o faltantes)",
                    pendientes.size());
                break;
            }

            // --- Paso C: Ordenar por peso de dependencia descendente, transversales al final ---
            cursables.sort((a, b) -> {
                Materia ma = materiaMap.get(a);
                Materia mb = materiaMap.get(b);
                if (ma.isEsTransversal() != mb.isEsTransversal()) {
                    return ma.isEsTransversal() ? 1 : -1;
                }
                int cmp = Integer.compare(
                    pesoDependencia.getOrDefault(b, 0),
                    pesoDependencia.getOrDefault(a, 0));
                if (cmp != 0) return cmp;
                return a.compareTo(b);
            });

            // --- Paso D: Asignar comisiones sin conflictos de horario ---
            for (String materiaId : cursables) {
                if (asignadas.size() >= maxMateriasPorCuatrimestre) break;

                Materia materia = materiaMap.get(materiaId);

                if (tieneHijas(materia, materiaMap)) {
                    MateriaAsignadaDTO electiva = resolverElectiva(
                        materia, materiaMap, comisionesPorMateria,
                        horariosOcupados, completadas, primerCuatrimestre);
                    if (electiva != null) {
                        asignadas.add(electiva);
                        agregarHorariosOcupados(electiva, comisionesPorMateria, horariosOcupados);
                        slotsResueltos.add(materiaId);
                    }
                    continue;
                }

                List<Comision> comisiones = comisionesPorMateria.getOrDefault(materiaId, List.of());

                if (primerCuatrimestre && !comisiones.isEmpty()) {
                    Comision elegida = comisiones.stream()
                        .filter(c -> !hayConflictoHorario(c.getHorarios(), horariosOcupados))
                        .findFirst()
                        .orElse(null);

                    if (elegida != null) {
                        MateriaAsignadaDTO dto = buildMateriaAsignada(materia, elegida);
                        dto.setAnual(materia.isAnual());
                        asignadas.add(dto);
                        horariosOcupados.addAll(elegida.getHorarios());
                    }
                } else if (primerCuatrimestre && comisiones.isEmpty()) {
                    continue;
                } else {
                    asignadas.add(MateriaAsignadaDTO.builder()
                        .materiaId(materia.getId())
                        .nombre(materia.getNombre())
                        .sinOferta(true)
                        .anual(materia.isAnual())
                        .build());
                }
            }

            if (asignadas.isEmpty()) {
                if (primerCuatrimestre) {
                    primerCuatrimestre = false;
                    continue;
                }
                log.warn("No se pudieron asignar materias en cuatrimestre {}. Cortando.", numCuatrimestre);
                break;
            }

            cuatrimestres.add(CuatrimestreDTO.builder()
                .numero(numCuatrimestre)
                .materias(asignadas)
                .build());

            // Completar materias no-anuales asignadas
            asignadas.stream()
                .filter(a -> !anualesCompletandose.contains(a.getMateriaId()))
                .forEach(a -> {
                    Materia m = materiaMap.get(a.getMateriaId());
                    if (m != null && m.isAnual()) {
                        materiasAnualesEnCurso.add(a.getMateriaId());
                        pendientes.remove(a.getMateriaId());
                    } else {
                        completadas.add(a.getMateriaId());
                        pendientes.remove(a.getMateriaId());
                    }
                });

            // Completar anuales que terminan este cuatrimestre (2do del año)
            for (String anualId : anualesCompletandose) {
                completadas.add(anualId);
                materiasAnualesEnCurso.remove(anualId);
            }

            // Marcar slots de electiva y todas sus hijas como completadas
            for (String slotId : slotsResueltos) {
                completadas.add(slotId);
                pendientes.remove(slotId);
                materiaMap.values().stream()
                    .filter(m -> m.getMateriaPadre() != null
                        && m.getMateriaPadre().getId().equals(slotId))
                    .map(Materia::getId)
                    .forEach(childId -> {
                        pendientes.remove(childId);
                        completadas.add(childId);
                    });
            }

            log.info("Cuatrimestre {}: {} materias asignadas, {} pendientes, {} anuales en curso",
                numCuatrimestre, asignadas.size(), pendientes.size(), materiasAnualesEnCurso.size());

            numCuatrimestre++;
            primerCuatrimestre = false;
        }

        return PlanOptimoDTO.builder()
            .cuatrimestres(cuatrimestres)
            .totalCuatrimestres(cuatrimestres.size())
            .materiasCompletadas(materiasYaAprobadas)
            .materiasPendientes(pendientes.size())
            .build();
    }

    // ── Paso A: Construcción del grafo inverso de dependencias ──

    /**
     * Para cada materia, identifica cuáles dependen directamente de ella.
     * Si B tiene como correlativa a A, entonces A -> {B} en el grafo inverso.
     */
    private Map<String, Set<String>> buildReverseDependencyGraph(List<Materia> materias) {
        Map<String, Set<String>> reverse = new HashMap<>();
        for (Materia m : materias) {
            for (Materia correlativa : m.getCorrelativas()) {
                reverse.computeIfAbsent(correlativa.getId(), k -> new HashSet<>())
                    .add(m.getId());
            }
        }
        return reverse;
    }

    /**
     * Calcula el peso de dependencia transitiva usando BFS.
     * El peso de una materia = cantidad de materias que dependen de ella (directa o indirectamente).
     */
    private Map<String, Integer> computeDependencyWeights(
            List<Materia> materias,
            Map<String, Set<String>> reverseDeps) {

        Map<String, Integer> weights = new HashMap<>();
        Map<String, Integer> cache = new HashMap<>();

        for (Materia m : materias) {
            weights.put(m.getId(), countTransitiveDependents(m.getId(), reverseDeps, cache));
        }

        return weights;
    }

    private int countTransitiveDependents(
            String id,
            Map<String, Set<String>> reverseDeps,
            Map<String, Integer> cache) {

        if (cache.containsKey(id)) return cache.get(id);

        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();

        Set<String> directDeps = reverseDeps.getOrDefault(id, Set.of());
        queue.addAll(directDeps);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            if (visited.add(current)) {
                queue.addAll(reverseDeps.getOrDefault(current, Set.of()));
            }
        }

        cache.put(id, visited.size());
        return visited.size();
    }

    // ── Paso D: Resolución de conflictos horarios ──

    private boolean hayConflictoHorario(List<Horario> nuevos, List<Horario> ocupados) {
        for (Horario nuevo : nuevos) {
            if (nuevo.getHoraInicio() == null || nuevo.getHoraFin() == null) continue;
            for (Horario ocupado : ocupados) {
                if (ocupado.getHoraInicio() == null || ocupado.getHoraFin() == null) continue;
                if (nuevo.getDia() != null && nuevo.getDia().equals(ocupado.getDia())) {
                    if (nuevo.getHoraInicio().isBefore(ocupado.getHoraFin())
                        && nuevo.getHoraFin().isAfter(ocupado.getHoraInicio())) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // ── Resolución de Electivas ──

    private boolean tieneHijas(Materia materia, Map<String, Materia> materiaMap) {
        return materiaMap.values().stream()
            .anyMatch(m -> m.getMateriaPadre() != null
                && m.getMateriaPadre().getId().equals(materia.getId()));
    }

    private boolean tieneHijaCursable(Materia slot, Map<String, Materia> materiaMap, Set<String> completadas) {
        return materiaMap.values().stream()
            .filter(m -> m.getMateriaPadre() != null
                && m.getMateriaPadre().getId().equals(slot.getId())
                && !completadas.contains(m.getId()))
            .anyMatch(hija -> hija.getCorrelativas().stream()
                .allMatch(c -> completadas.contains(c.getId())));
    }

    /**
     * Para un slot de electiva, busca entre las materias hijas la que mejor
     * se ajuste al horario ya ocupado. Criterio: la que tenga la comisión con
     * menor cantidad de slots horarios (menos invasiva en el cronograma).
     */
    private MateriaAsignadaDTO resolverElectiva(
            Materia electivaSlot,
            Map<String, Materia> materiaMap,
            Map<String, List<Comision>> comisionesPorMateria,
            List<Horario> horariosOcupados,
            Set<String> completadas,
            boolean conOferta) {

        List<Materia> opciones = materiaMap.values().stream()
            .filter(m -> m.getMateriaPadre() != null
                && m.getMateriaPadre().getId().equals(electivaSlot.getId()))
            .filter(m -> !completadas.contains(m.getId()))
            .filter(m -> m.getCorrelativas().stream()
                .allMatch(c -> completadas.contains(c.getId())))
            .collect(Collectors.toList());

        if (opciones.isEmpty()) {
            log.debug("Sin opciones disponibles para electiva {}", electivaSlot.getNombre());
            return null;
        }

        MateriaAsignadaDTO mejor = null;
        int menorSlots = Integer.MAX_VALUE;

        for (Materia opcion : opciones) {
            List<Comision> comisiones = comisionesPorMateria.getOrDefault(opcion.getId(), List.of());

            if (conOferta && !comisiones.isEmpty()) {
                for (Comision comision : comisiones) {
                    if (!hayConflictoHorario(comision.getHorarios(), horariosOcupados)) {
                        int totalSlots = comision.getHorarios().size();
                        if (totalSlots < menorSlots) {
                            menorSlots = totalSlots;
                            mejor = buildMateriaAsignada(opcion, comision);
                        }
                    }
                }
            } else if (!conOferta) {
                return MateriaAsignadaDTO.builder()
                    .materiaId(opcion.getId())
                    .nombre(opcion.getNombre())
                    .sinOferta(true)
                    .build();
            }
        }

        return mejor;
    }

    // ── Helpers ──

    private MateriaAsignadaDTO buildMateriaAsignada(Materia materia, Comision comision) {
        List<HorarioDTO> horarios = comision.getHorarios().stream()
            .map(HorarioDTO::fromDomain)
            .collect(Collectors.toList());

        return MateriaAsignadaDTO.builder()
            .materiaId(materia.getId())
            .nombre(materia.getNombre())
            .comisionId(comision.getComisionId())
            .sede(comision.getSede())
            .modalidad(comision.getModalidad())
            .horarios(horarios)
            .sinOferta(false)
            .build();
    }

    private void agregarHorariosOcupados(
            MateriaAsignadaDTO asignada,
            Map<String, List<Comision>> comisionesPorMateria,
            List<Horario> horariosOcupados) {

        if (asignada.getComisionId() == null) return;

        comisionesPorMateria.getOrDefault(asignada.getMateriaId(), List.of()).stream()
            .filter(c -> c.getComisionId().equals(asignada.getComisionId()))
            .findFirst()
            .ifPresent(c -> horariosOcupados.addAll(c.getHorarios()));
    }

    private Set<String> buildAprobadasFromHistoria(List<HistoriaAcademicaDTO> historia) {
        if (historia == null || historia.isEmpty()) return Set.of();
        return historia.stream()
            .map(h -> normalizeId(h.getCodigo()))
            .collect(Collectors.toSet());
    }

    private static String normalizeId(String id) {
        if (id == null) return "";
        String normalized = id.replaceFirst("^0+", "");
        return normalized.isEmpty() ? "0" : normalized;
    }
}
