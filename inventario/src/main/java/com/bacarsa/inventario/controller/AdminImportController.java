package com.bacarsa.inventario.controller;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.services.CamarasActivasImportService;
import com.bacarsa.inventario.services.MaquinaTesoreriaImportService;
import com.google.firebase.FirebaseApp;

@RestController
@RequestMapping("/api/admin/import")
public class AdminImportController {

    @Value("${firebase.collection.camaras:camaras}")
    private String coleccionCamaras;

    @Value("${app.import.camaras-activas.allow-http:false}")
    private boolean allowHttpImport;

    @Value("${app.import.maquinas-tesoreria.allow-http:false}")
    private boolean allowHttpImportMaquinas;

    private final CamarasActivasImportService camarasActivasImportService;
    private final CamaraRepository camaraRepository;
    private final MaquinaTesoreriaImportService maquinaTesoreriaImportService;

    public AdminImportController(
            CamarasActivasImportService camarasActivasImportService,
            CamaraRepository camaraRepository,
            MaquinaTesoreriaImportService maquinaTesoreriaImportService) {
        this.camarasActivasImportService = camarasActivasImportService;
        this.camaraRepository = camaraRepository;
        this.maquinaTesoreriaImportService = maquinaTesoreriaImportService;
    }

    /**
     * Diagnóstico: proyecto Firebase del service account y cantidad de documentos en la colección configurada.
     * No modifica datos; sirve para comprobar por qué GET /api/camaras devuelve [].
     */
    @GetMapping("/diagnostico")
    public ResponseEntity<Map<String, Object>> diagnostico() throws ExecutionException, InterruptedException {
        String projectId = FirebaseApp.getInstance().getOptions().getProjectId();
        int n = camaraRepository.findAll().size();
        return ResponseEntity.ok(Map.of(
                "firebaseProjectId", projectId != null ? projectId : "",
                "coleccionCamaras", coleccionCamaras,
                "documentosEnColeccion", n));
    }

    /**
     * Ayuda si abrís esta URL en el navegador (GET): la importación real es solo por POST.
     */
    @GetMapping("/camaras-activas")
    public ResponseEntity<Map<String, Object>> ayudaImportarCamarasActivas() {
        return ResponseEntity.ok(Map.of(
                "mensaje",
                "Este recurso ejecuta la importación solo con método POST (desde curl, Postman o código). "
                        + "Si ves esto en el navegador, estás usando GET.",
                "metodo", "POST",
                "ruta", "/api/admin/import/camaras-activas",
                "requierePropiedad", "app.import.camaras-activas.allow-http=true",
                "allowHttpImportHabilitado", allowHttpImport,
                "ejemploCurl",
                "curl.exe -X POST \"http://localhost:8081/api/admin/import/camaras-activas\""));
    }

    /**
     * Ejecuta la misma importación que al arrancar con {@code app.import.camaras-activas.enabled=true}.
     * Requiere {@code app.import.camaras-activas.allow-http=true} (solo para entorno controlado).
     */
    @PostMapping("/camaras-activas")
    public ResponseEntity<?> importarCamarasActivas()
            throws IOException, ExecutionException, InterruptedException {
        if (!allowHttpImport) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error",
                    "Importación HTTP deshabilitada. Definí app.import.camaras-activas.allow-http=true "
                            + "en application.properties (o variable de entorno equivalente), reiniciá el servidor "
                            + "y volvé a llamar POST /api/admin/import/camaras-activas."));
        }
        int importadas = camarasActivasImportService.importarDesdeClasspathJson();
        return ResponseEntity.ok(Map.of(
                "importadas", importadas,
                "mensaje",
                "Revisá GET /api/admin/import/diagnostico y GET /api/camaras."));
    }

    /**
     * Carga los 58 equipos de Tesorería (Bolsillos, Validadora, Recontadora, Envasadora, Fajadora)
     * desde los datos hardcodeados del inventario CSV. Idempotente: sobrescribe si ya existen.
     * Requiere {@code app.import.maquinas-tesoreria.allow-http=true}.
     */
    @PostMapping("/maquinas-tesoreria")
    public ResponseEntity<?> importarMaquinasTesoreria() throws ExecutionException, InterruptedException {
        if (!allowHttpImportMaquinas) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error",
                    "Importación HTTP deshabilitada. Definí app.import.maquinas-tesoreria.allow-http=true "
                            + "en application.properties, reiniciá el servidor y volvé a llamar "
                            + "POST /api/admin/import/maquinas-tesoreria."));
        }
        int importadas = maquinaTesoreriaImportService.importarTodos();
        return ResponseEntity.ok(Map.of(
                "importadas", importadas,
                "mensaje", "Revisá GET /api/maquinas-tesoreria."));
    }
}
