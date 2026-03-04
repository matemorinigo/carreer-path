package com.carreerpath.controller;

import com.carreerpath.dto.HistoriaAcademicaDTO;
import com.carreerpath.dto.MateriaIngestionDTO;
import com.carreerpath.dto.OfertaMateriaDTO;
import com.carreerpath.service.DataIngestionService;
import com.carreerpath.service.OfertaIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DataIngestionService dataIngestionService;
    private final OfertaIngestionService ofertaIngestionService;

    @PostMapping("/ingest-plan")
    public ResponseEntity<DataIngestionService.IngestionResult> ingestPlan(
            @RequestBody List<MateriaIngestionDTO> materias) {
        DataIngestionService.IngestionResult result = dataIngestionService.ingestar(materias);
        HttpStatus status = result.isExito() ? HttpStatus.CREATED : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status).body(result);
    }

    @PostMapping("/ingest-oferta")
    public ResponseEntity<OfertaIngestionService.IngestionResult> ingestOferta(
            @RequestBody List<OfertaMateriaDTO> oferta) {
        OfertaIngestionService.IngestionResult result = ofertaIngestionService.ingestarOferta(oferta);
        HttpStatus status = result.isExito() ? HttpStatus.CREATED : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status).body(result);
    }

    @PostMapping("/ingest-historia")
    public ResponseEntity<OfertaIngestionService.IngestionResult> ingestHistoria(
            @RequestBody List<HistoriaAcademicaDTO> historia) {
        OfertaIngestionService.IngestionResult result = ofertaIngestionService.ingestarHistoria(historia);
        HttpStatus status = result.isExito() ? HttpStatus.OK : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status).body(result);
    }
}
