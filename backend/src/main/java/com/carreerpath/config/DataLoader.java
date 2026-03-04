package com.carreerpath.config;

import com.carreerpath.dto.MateriaIngestionDTO;
import com.carreerpath.dto.OfertaMateriaDTO;
import com.carreerpath.service.DataIngestionService;
import com.carreerpath.service.MateriaService;
import com.carreerpath.service.OfertaIngestionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final DataIngestionService dataIngestionService;
    private final OfertaIngestionService ofertaIngestionService;
    private final MateriaService materiaService;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        log.info("Cargando datos estáticos del plan de estudios y oferta...");

        materiaService.eliminarTodas();

        try (InputStream planStream = new ClassPathResource("data/plan_estudios.json").getInputStream()) {
            List<MateriaIngestionDTO> plan = objectMapper.readValue(
                planStream, new TypeReference<>() {});
            DataIngestionService.IngestionResult result = dataIngestionService.ingestar(plan);
            log.info("Plan de estudios: {}", result.getMensaje());
        }

        try (InputStream ofertaStream = new ClassPathResource("data/oferta_comisiones.json").getInputStream()) {
            List<OfertaMateriaDTO> oferta = objectMapper.readValue(
                ofertaStream, new TypeReference<>() {});
            OfertaIngestionService.IngestionResult result = ofertaIngestionService.ingestarOferta(oferta);
            log.info("Oferta de comisiones: {}", result.getMensaje());
        }

        log.info("Datos estáticos cargados correctamente");
    }
}
