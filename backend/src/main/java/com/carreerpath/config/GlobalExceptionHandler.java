package com.carreerpath.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleBadJson(HttpMessageNotReadableException e) {
        log.warn("Request con JSON inválido: {}", e.getMessage());
        return ResponseEntity.badRequest().body(
            Map.of("error", "El cuerpo del request no es un JSON válido."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
        log.error("Error inesperado", e);
        return ResponseEntity.internalServerError().body(
            Map.of("error", "Error interno del servidor."));
    }
}
