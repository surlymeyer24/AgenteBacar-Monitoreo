package com.bacarsa.inventario.db;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

@Configuration
public class FirebaseConfig {

    private static final String CLASSPATH_PREFIX = "classpath:";

    @Value("${firebase.config.path}")
    private String firebaseConfigPath;

    @Bean
    public Firestore firestore() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream serviceAccount = openCredentialsStream()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp.initializeApp(options);
            }
        }
        return FirestoreClient.getFirestore();
    }

    /**
     * Ruta en disco (relativa a {@code user.dir}, típicamente la carpeta del módulo {@code inventario}),
     * o absoluta. Si el valor empieza con {@code classpath:}, se lee del classpath (compatibilidad).
     */
    private InputStream openCredentialsStream() throws IOException {
        String raw = firebaseConfigPath.trim();
        if (raw.regionMatches(true, 0, CLASSPATH_PREFIX, 0, CLASSPATH_PREFIX.length())) {
            String resource = raw.substring(CLASSPATH_PREFIX.length()).trim();
            if (resource.startsWith("/")) {
                resource = resource.substring(1);
            }
            InputStream in = getClass().getClassLoader().getResourceAsStream(resource);
            if (in == null) {
                throw new FileNotFoundException("Recurso classpath no encontrado: " + resource);
            }
            return in;
        }

        Path path = Paths.get(raw);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
        }
        if (!Files.isRegularFile(path)) {
            throw new FileNotFoundException(
                    "Archivo de credenciales Firebase no encontrado: " + path.toAbsolutePath());
        }
        return Files.newInputStream(path);
    }
}
