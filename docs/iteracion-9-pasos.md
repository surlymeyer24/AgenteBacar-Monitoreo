# Iteración 9 — Usuarios con Firebase Auth

## Objetivos

1. Completar `Rol.java` (enum) y `Usuario.java` con los datos extra que Firebase Auth no guarda (nombre, rol, activo).
2. Persistir esos datos en Firestore colección `usuarios`, usando el **`uid` de Firebase** como ID del documento.
3. CRUD de usuarios via endpoints REST.
4. Verificar el **Firebase ID token** en los requests al backend usando el Admin SDK ya instalado.

> **Decisión clave:** Firebase Auth maneja login, logout, tokens y sesiones. El backend NO implementa nada de eso. `Sesion.java` queda fuera de scope por ahora — Firebase ya resuelve ese problema. No se agrega `spring-security-crypto` ni BCrypt.
>
> **Ya existe:** Firebase Admin SDK 9.2.0 en `pom.xml`. `FirebaseAuth.getInstance()` disponible sin dependencias nuevas.

---

## Parte A: Modelos

### 1. `Rol.java` → convertir a enum

```java
public enum Rol {
    ADMIN,
    OPERADOR,
    VISUALIZADOR
}
```

### 2. `Usuario.java` → completar

El `id` es el **`uid` de Firebase Auth** — no se genera en el backend.

```java
@Getter @Setter
public class Usuario {
    private String id;       // uid de Firebase Auth
    private String nombre;
    private String email;    // espejo del email en Firebase Auth
    private Rol rol;
    private boolean activo;
}
```

`Sesion.java` no se toca en esta iteración.

---

## Parte B: DTOs

### 3. `UsuarioDTO` (respuesta)

Campos: `id`, `nombre`, `email`, `rol` (String), `activo`.

### 4. `UsuarioCreateDTO` (entrada)

Campos: `uid` (`@NotBlank` — viene del frontend tras registrar en Firebase Auth), `nombre` (`@NotBlank`), `email` (`@NotBlank`), `rol` (`@NotNull`).

> El frontend crea el usuario en Firebase Auth primero (con email/password), obtiene el `uid`, y luego llama a este endpoint para guardar los datos extra.

---

## Parte C: Mapper

### 5. `UsuarioMapper`

Manual, con null checks. Métodos estáticos:

- `toDTO(Usuario u) → UsuarioDTO`
- `toModel(UsuarioCreateDTO dto) → Usuario` — mapea `uid` → `id`, copia nombre/email/rol, marca `activo = true`.

---

## Parte D: Repositorio

### 6. Propiedad en `application.properties`

```properties
firebase.collection.usuarios=usuarios
```

### 7. `UsuarioRepository`

Colección `usuarios`. Inyección por constructor + `@Value`. El documento en Firestore se llama igual que el `uid`.

| Método | Descripción |
|---|---|
| `save(Usuario u)` | `set` con merge; doc ID = `u.getId()` |
| `findById(String uid)` | Devuelve `Optional<Usuario>` |
| `findByEmail(String email)` | Query `whereEqualTo("email", ...)` |
| `findAll()` | Lista todos los documentos |
| `delete(String uid)` | Borra documento |

---

## Parte E: Verificación de token

### 8. `FirebaseTokenFilter` (en `security/`)

Filtro que intercepta todos los requests a `/api/**` y verifica el Firebase ID token.

```java
String authHeader = request.getHeader("Authorization");
// espera: "Bearer <idToken>"
FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
// decoded.getUid() → uid del usuario autenticado
```

- Si el header falta o el token es inválido → 401.
- Si es válido → el request continúa; el `uid` queda disponible como atributo del request.
- Se registra como `@Component` + `OncePerRequestFilter` (Spring).
- **Excepción:** `OPTIONS` (preflight CORS) pasa sin verificar.

> No requiere `spring-boot-starter-security`. `OncePerRequestFilter` viene de `spring-web`, que ya está en el proyecto.

### 9. Registrar el filtro en `CorsConfig` (o en `config/FilterConfig`)

```java
@Bean
public FilterRegistrationBean<FirebaseTokenFilter> firebaseFilter(FirebaseTokenFilter filter) {
    FilterRegistrationBean<FirebaseTokenFilter> bean = new FilterRegistrationBean<>(filter);
    bean.addUrlPatterns("/api/*");
    return bean;
}
```

---

## Parte F: Servicio y controlador

### 10. `UsuarioService`

| Método | Descripción |
|---|---|
| `crear(UsuarioCreateDTO dto) → UsuarioDTO` | Verifica que el `uid` exista en Firebase Auth (`FirebaseAuth.getInstance().getUser(uid)`), luego guarda en Firestore |
| `listar() → List<UsuarioDTO>` | `repo.findAll()` mapeado |
| `buscarPorId(String uid) → UsuarioDTO` | 404 si no existe |
| `actualizar(String uid, UsuarioCreateDTO dto) → UsuarioDTO` | Solo actualiza nombre/rol/activo |
| `eliminar(String uid)` | Borra doc de Firestore (no elimina el usuario de Firebase Auth) |

### 11. `UsuarioController` — base `/api/usuarios`

| Método HTTP | Path | Body | Respuesta |
|---|---|---|---|
| GET | `/api/usuarios` | — | `List<UsuarioDTO>` |
| GET | `/api/usuarios/{uid}` | — | `UsuarioDTO` |
| POST | `/api/usuarios` | `@Valid UsuarioCreateDTO` | `UsuarioDTO` (201) |
| PUT | `/api/usuarios/{uid}` | `@Valid UsuarioCreateDTO` | `UsuarioDTO` |
| DELETE | `/api/usuarios/{uid}` | — | 204 No Content |

---

## Prueba integrada

1. `./mvnw compile` — sin errores.
2. Desde el frontend (o Postman), obtener un ID token de Firebase Auth para un usuario de prueba.
3. `POST /api/usuarios` con el token en header `Authorization: Bearer <token>` y body `{ "uid": "...", "nombre": "Admin IT", "email": "...", "rol": "ADMIN" }` → 201.
4. Verificar documento en Firestore colección `usuarios`.
5. `GET /api/usuarios` con token válido → lista con el usuario.
6. Request sin token → 401.
7. Request con token vencido o inválido → 401.
8. `DELETE /api/usuarios/{uid}` → 204; documento eliminado en Firestore, usuario sigue en Firebase Auth.

---

## Notas

- El frontend registra al usuario en Firebase Auth (con email/password o Google), obtiene el `uid` y llama a `POST /api/usuarios` para crear el perfil extendido en Firestore.
- `FirebaseAuth.getInstance()` ya está disponible porque `FirebaseConfig` inicializa el SDK al arrancar.
- Eliminar un usuario de Firebase Auth (si hace falta) se puede hacer con `FirebaseAuth.getInstance().deleteUser(uid)` — queda para una iteración futura.
- `Sesion.java` y `Rol.java` como clase vacía se dejan sin tocar hasta que se decida su uso final.
