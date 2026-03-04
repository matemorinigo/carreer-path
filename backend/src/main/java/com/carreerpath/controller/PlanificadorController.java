package com.carreerpath.controller;

import com.carreerpath.dto.GenerarPlanRequestDTO;
import com.carreerpath.dto.PlanOptimoDTO;
import com.carreerpath.service.PlanificadorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/planificador")
@RequiredArgsConstructor
public class PlanificadorController {

    private final PlanificadorService planificadorService;

    @PostMapping("/generar")
    public ResponseEntity<PlanOptimoDTO> generarPlanOptimo(
            @RequestBody GenerarPlanRequestDTO request) {
        PlanOptimoDTO plan = planificadorService.generarPlanConHistoria(
            request.getHistoria(), request.getMaxMaterias());
        return ResponseEntity.ok(plan);
    }
}
