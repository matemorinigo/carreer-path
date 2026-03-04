package com.carreerpath.controller;

import com.carreerpath.dto.MateriaDTO;
import com.carreerpath.dto.MateriaIngestionDTO;
import com.carreerpath.service.DataIngestionService;
import com.carreerpath.service.MateriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador REST para la API de Materias y Plan de Estudios.
 * Endpoints para CRUD, consultas y ingesta de planes genéricos.
 */
@RestController
@RequestMapping("/api/materias")
public class MateriaController {

    private final MateriaService materiaService;
    private final DataIngestionService ingestionService;

    public MateriaController(MateriaService materiaService, DataIngestionService ingestionService) {
        this.materiaService = materiaService;
        this.ingestionService = ingestionService;
    }

    /**
     * GET /api/materias
     * Obtiene todas las materias del plan.
     */
    @GetMapping
    public ResponseEntity<List<MateriaDTO>> obtenerTodas() {
        return ResponseEntity.ok(materiaService.obtenerTodas());
    }

    /**
     * GET /api/materias/{id}
     * Obtiene una materia específica por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MateriaDTO> obtenerPorId(@PathVariable String id) {
        Optional<MateriaDTO> materia = materiaService.obtenerPorId(id);
        return materia.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * GET /api/materias/filter/obligatorias
     * Obtiene solo las materias obligatorias.
     */
    @GetMapping("/filter/obligatorias")
    public ResponseEntity<List<MateriaDTO>> obtenerObligatorias() {
        return ResponseEntity.ok(materiaService.obtenerObligatorias());
    }

    /**
     * GET /api/materias/filter/optativas
     * Obtiene solo las materias optativas.
     */
    @GetMapping("/filter/optativas")
    public ResponseEntity<List<MateriaDTO>> obtenerOptativas() {
        return ResponseEntity.ok(materiaService.obtenerOptativas());
    }

    /**
     * GET /api/materias/{padreId}/hijas
     * Obtiene las materias hijas de una materia padre (ej: opciones de Electivas).
     */
    @GetMapping("/{padreId}/hijas")
    public ResponseEntity<List<MateriaDTO>> obtenerHijas(@PathVariable String padreId) {
        return ResponseEntity.ok(materiaService.obtenerHijas(padreId));
    }

    /**
     * GET /api/materias/estadisticas
     * Obtiene estadísticas del plan de estudios.
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        return ResponseEntity.ok(materiaService.obtenerEstadisticas());
    }

    /**
     * POST /api/materias/ingestar
     * Ingesta un plan de estudios completo desde JSON.
     * El JSON debe ser una lista de MateriaIngestionDTO.
     *
     * Ejemplo:
     * [
     *   {"id": "3621", "nombre": "Matemática Discreta", "horas": 4, "esObligatoria": true},
     *   {"id": "3622", "nombre": "Análisis Matemático I", "horas": 4},
     *   {"id": "3656", "nombre": "Estadística Aplicada", "horas": 4,
     *    "correlativas": ["3651", "3641"]}
     * ]
     */
    @PostMapping("/ingestar")
    public ResponseEntity<DataIngestionService.IngestionResult> ingestar(
        @RequestBody List<MateriaIngestionDTO> materias
    ) {
        DataIngestionService.IngestionResult resultado = ingestionService.ingestar(materias);
        HttpStatus status = resultado.isExito() ? HttpStatus.CREATED : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status).body(resultado);
    }

    /**
     * DELETE /api/materias
     * Elimina todas las materias (útil para limpiar e reingestar).
     */
    @DeleteMapping
    public ResponseEntity<Map<String, String>> eliminarTodas() {
        materiaService.eliminarTodas();
        return ResponseEntity.ok(Map.of("mensaje", "Todas las materias eliminadas"));
    }
}
