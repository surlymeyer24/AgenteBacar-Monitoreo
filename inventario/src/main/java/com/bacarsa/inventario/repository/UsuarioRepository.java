package com.bacarsa.inventario.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import com.bacarsa.inventario.models.Rol;
import com.bacarsa.inventario.models.Usuario;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

@Repository
public class UsuarioRepository {

    private final Firestore firestore;
    private final String collectionName;

    public UsuarioRepository(Firestore firestore,
            @Value("${firebase.collection.usuarios}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    @CacheEvict(value = "usuarios", allEntries = true)
    public void save(Usuario u) throws ExecutionException, InterruptedException {
        Map<String, Object> data = new HashMap<>();
        data.put("nombre", u.getNombre());
        data.put("email", u.getEmail());
        data.put("rol", u.getRol() == null ? null : u.getRol().name());
        data.put("activo", u.isActivo());
        firestore.collection(collectionName).document(u.getId()).set(data).get();
    }

    /**
     * No cachear vacíos: Spring Cache desempaqueta Optional, así que #result es Usuario o null.
     * Un miss cacheado dejaría al usuario como VISUALIZADOR hasta que expire el TTL.
     */
    @Cacheable(value = "usuarios", key = "#uid", unless = "#result == null")
    public Optional<Usuario> findById(String uid) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(uid).get().get();
        if (!doc.exists()) {
            return Optional.empty();
        }
        return Optional.of(snapshotToUsuario(doc));
    }

    @Cacheable(value = "usuarios", key = "'email:' + #email", unless = "#result == null")
    public Optional<Usuario> findByEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName)
                .whereEqualTo("email", email)
                .get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        if (docs.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(snapshotToUsuario(docs.get(0)));
    }

    @Cacheable("usuarios")
    public List<Usuario> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Usuario> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            result.add(snapshotToUsuario(doc));
        }
        return result;
    }

    @CacheEvict(value = "usuarios", allEntries = true)
    public void delete(String uid) throws ExecutionException, InterruptedException {
        firestore.collection(collectionName).document(uid).delete().get();
    }

    private static Usuario snapshotToUsuario(DocumentSnapshot doc) {
        Usuario u = new Usuario();
        u.setId(doc.getId());
        u.setNombre(doc.getString("nombre"));
        u.setEmail(doc.getString("email"));
        String rolRaw = doc.getString("rol");
        if (rolRaw != null) {
            try {
                u.setRol(Rol.valueOf(rolRaw));
            } catch (IllegalArgumentException e) {
                u.setRol(null);
            }
        }
        Boolean activo = doc.getBoolean("activo");
        u.setActivo(Boolean.TRUE.equals(activo));
        return u;
    }
}
