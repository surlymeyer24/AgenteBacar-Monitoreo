package com.bacarsa.inventario.config;

import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ExecutionException.class)
    public ResponseEntity<Map<String, String>> onFirestore(ExecutionException ex) {
        Throwable root = ex.getCause() != null ? ex.getCause() : ex;
        String msg = root.getMessage() != null ? root.getMessage() : ex.getClass().getSimpleName();
        log.warn("Firestore ExecutionException: {}", msg, root);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Error al acceder a Firestore: " + msg));
    }

    @ExceptionHandler(InterruptedException.class)
    public ResponseEntity<Map<String, String>> onInterrupted(InterruptedException ex) {
        Thread.currentThread().interrupt();
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Operación interrumpida"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> onValidation(MethodArgumentNotValidException ex) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(Map.of("error", "Datos inválidos: " + detalle));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> onBadJson(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "JSON inválido o cuerpo vacío inesperado"));
    }

    @ExceptionHandler(com.bacarsa.inventario.exception.ApiConflictException.class)
    public ResponseEntity<Map<String, String>> onConflict(com.bacarsa.inventario.exception.ApiConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> onIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Solicitud inválida"));
    }
}
