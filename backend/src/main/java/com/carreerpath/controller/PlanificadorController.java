package com.carreerpath.controller;

import com.carreerpath.dto.GenerarPlanRequestDTO;
import com.carreerpath.dto.PlanOptimoDTO;
import com.carreerpath.service.PlanificadorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/planificador")
@RequiredArgsConstructor
@Slf4j
public class PlanificadorController {

    private final PlanificadorService planificadorService;

    @PostMapping("/generar")
    public ResponseEntity<?> generarPlanOptimo(
            @RequestBody GenerarPlanRequestDTO request) {

        int maxMaterias = Math.max(1, Math.min(request.getMaxMaterias(), 10));

        try {
            PlanOptimoDTO plan = planificadorService.generarPlanConHistoria(
                request.getHistoria() != null ? request.getHistoria() : List.of(),
                maxMaterias);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            log.error("Error generando plan", e);
            return ResponseEntity.badRequest().body(
                Map.of("error", "No se pudo generar el plan. Verificá que la historia académica sea válida."));
        }
    }
}
