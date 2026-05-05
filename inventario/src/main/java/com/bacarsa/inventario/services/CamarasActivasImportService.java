package com.bacarsa.inventario.services;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.bacarsa.inventario.models.Camara;
import com.bacarsa.inventario.repository.CamaraRepository;
import com.bacarsa.inventario.util.FirestoreDocumentId;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.FirebaseApp;

import lombok.Data;

/**
 * Importa las cámaras desde {@code classpath:data/camaras-activas.json}.
 * El ID del documento es el nombre del dispositivo ({@code nombreDispositivo}); si falta, se usa {@code id} del JSON.
 */
@Service
public class CamarasActivasImportService {

    private static final Logger log = LoggerFactory.getLogger(CamarasActivasImportService.class);

    private final CamaraRepository camaraRepository;
    private final ObjectMapper objectMapper;

    public CamarasActivasImportService(CamaraRepository camaraRepository, ObjectMapper objectMapper) {
        this.camaraRepository = camaraRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Lee el JSON del classpath y escribe/actualiza documentos en Firestore.
     *
     * @return cantidad de documentos escritos
     * @throws IllegalStateException si no existe el recurso en el classpath (p. ej. JAR mal armado)
     */
    public int importarDesdeClasspathJson() throws IOException, ExecutionException, InterruptedException {
        Resource res = new ClassPathResource("data/camaras-activas.json");
        if (!res.exists()) {
            throw new IllegalStateException(
                    "No está data/camaras-activas.json en el classpath. Recompilá el backend o copiá el recurso.");
        }
        String projectId = FirebaseApp.getInstance().getOptions().getProjectId();
        log.info("Import cámaras activas: proyecto Firebase={}, ejecutando escritura…", projectId);

        try (InputStream is = res.getInputStream()) {
            List<CamaraImportRow> rows = objectMapper.readValue(is, new TypeReference<List<CamaraImportRow>>() {});
            String fechaAltaIso = LocalDate.now().toString();
            int n = 0;
            for (CamaraImportRow row : rows) {
                String docId = FirestoreDocumentId.sanitizar(row.getNombreDispositivo());
                if (docId == null || docId.isBlank()) {
                    docId = FirestoreDocumentId.sanitizar(row.getId());
                }
                if (docId == null || docId.isBlank()) {
                    continue;
                }
                Camara c = new Camara();
                c.setNombre(row.getNombre());
                c.setUbicacion(row.getUbicacion());
                c.setMarca(row.getMarca());
                c.setDescripcion(row.getDescripcion());
                c.setDireccionIp(blankToNull(row.getDireccionIp()));
                c.setPuerto(row.getPuerto());
                c.setTipo(blankToNull(row.getTipo()));
                c.setFechaAlta(fechaAltaIso);
                camaraRepository.guardarConId(docId, c);
                n++;
            }
            log.info("Import cámaras activas: {} documentos escritos en Firestore (proyecto {}).", n, projectId);
            return n;
        }
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static final class CamaraImportRow {
        /** Legacy; usado solo si {@link #nombreDispositivo} está vacío. */
        private String id;
        /** ID del documento Firestore (preferido). */
        private String nombreDispositivo;
        private String nombre;
        private String ubicacion;
        private String marca;
        private String descripcion;
        private String direccionIp;
        private Integer puerto;
        private String tipo;
    }
}
