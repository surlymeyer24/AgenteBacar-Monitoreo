# Plan de seguridad — Sistema Inventario BACARSA
# BORRADOR v2 — sujeto a revisión

> **Estado:** borrador para discusión. Algunas decisiones dependen de información
> que no está en el repo (ver sección "Prerequisitos antes de ejecutar").

---

## Prerequisitos antes de ejecutar cualquier fase

Estas dos preguntas cambian la priorización. Hay que responderlas primero.

### P1 — ¿El registro de usuarios en Firebase Auth está abierto o cerrado?

Si cualquiera puede crear una cuenta con cualquier email, las Firestore Rules
propuestas (`request.auth != null`) solo garantizan que el usuario tiene *alguna*
cuenta de Firebase — no que sea de la empresa. Eso convierte la Fase 1 en seguridad
cosmética hasta que se resuelva la Fase 2.4.

**Acción:** ir a Firebase Console → Authentication → Users y verificar cuántos
usuarios existen y con qué dominios de email.

- Si son todos `@bacarsa` y el registro no es público: la Fase 1 es suficiente
  como primera barrera mientras se trabaja la Fase 2.
- Si hay cuentas de Gmail o el registro es abierto: la Fase 2.4 pasa a ser
  prerequisito de la Fase 1, no una tarea opcional de "esta semana".

### P2 — ¿`computadoras.txt` fue commiteado por error o es intencional?

El archivo `inventario/computadoras.txt` contiene en el repo:
- UUID real de una máquina de producción
- IP pública `190.210.65.18`
- AnyDesk ID `1809016746`
- Hostname `DESKTOP-P0TUHQI`
- Lista de procesos activos al momento del commit

Eso es un archivo de reconocimiento. Si el repo es o fue público en algún momento,
esa información ya está expuesta. Si es privado, el riesgo es menor pero igual
no debería estar versionado.

**Acción antes de continuar:** confirmar si el repo es privado y si hubo algún
período en que fue público. Independientemente, agregar `computadoras.txt` al
`.gitignore` y limpiar el historial con `git filter-repo`.

---

## Fase 1 — Urgente (hoy)

### 1.1 Reemplazar `firestore.rules` completo

> **Nota para quien lo lea:** los agentes C# (CyberWatch / AgenteBacar) escriben
> con Admin SDK, que bypasea las Security Rules completamente. `allow write: if false`
> no los afecta. Si en algún momento un agente empieza a fallar escrituras después
> de este cambio, el problema es otro (credenciales, red) — no estas rules.

Archivo: `inventario/firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Admin SDK (agentes C# y backend Spring) bypasea estas rules.
    // Estas rules solo aplican a clientes web (SDK de Firebase en el front).

    match /computadoras/{id} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    // CRÍTICO: write:false bloquea enviarComandoAMaquinas() en useComandoHW.js.
    // Ver tarea 1.2 — hay que migrar esa escritura al backend antes o junto con
    // este deploy, o el botón "Actualizar agente" deja de funcionar.
    match /tareas/{id} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /cyberwatch_instancias/{machineId} {
      allow read:  if request.auth != null;
      allow write: if false;

      match /alertas/{alertId} {
        allow read:   if request.auth != null;
        allow create: if false;
        allow update, delete: if false;
      }

      match /historial_navegacion/{entryId} {
        allow read:  if request.auth != null;
        allow write: if false;
      }

      match /logs_amenazas/{logId} {
        allow read:  if request.auth != null;
        allow write: if false;
      }
    }

    match /config/{doc} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /{path=**}/alertas/{alertId} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /{path=**}/logs_amenazas/{logId} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /cyberwatch_logs/{logId} {
      allow read:  if request.auth != null;
      allow write: if false;
    }

    match /logs_actualizaciones/{id} {
      allow read:  if request.auth != null;
      allow write: if false;
    }
  }
}
```

```bash
firebase deploy --only firestore:rules
```

### 1.2 Mover escritura de tareas al backend (hacer junto con 1.1)

`inventario-front/src/hooks/useComandoHW.js` escribe directo a Firestore con el
SDK del cliente. Con las rules de 1.1, esa escritura falla con `permission-denied`.

**Hay dos opciones. Elegir una antes de empezar:**

**Opción A — recomendada:** crear endpoint en Spring y llamarlo desde el front.
```
POST /api/computadoras/{uuid}/comando
Body: { "comando": "ACTUALIZAR_AGENTE" | "ACTUALIZAR_DATOS" | "RESETEAR_ID" }
```
El endpoint verifica el token, verifica el rol (cuando esté implementado en Fase 2),
y escribe en Firestore con Admin SDK. El front reemplaza `setDoc()` por `apiFetch()`.

**Opción B — temporal:** deployar 1.1 sin 1.2 y agregar una excepción en las rules
solo para `tareas` mientras se implementa el endpoint:
```javascript
match /tareas/{id} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null;  // temporal, peor que write:false
}
```
No recomendada porque solo agrega `auth != null` sin verificar rol. Útil solo
si hay urgencia de deployar las rules hoy y el endpoint tarda unos días.

### 1.3 Sacar `allow-http=true` de producción

> Reclasificado de Fase 3 a urgente. El flag está commiteado con `true` en
> `application.properties`. Aunque el endpoint requiere token Firebase válido,
> cualquier usuario autenticado puede llamar `/api/admin/import/camaras-activas`
> hoy. No es tan grave como las Firestore Rules abiertas, pero está en el repo
> y activo.

```properties
# application.properties (producción)
app.import.camaras-activas.allow-http=false
app.import.maquinas-tesoreria.allow-http=false
app.migration.bulk-asignada.enabled=false
app.migration.bulk-asignada.run-on-startup=false
```

Si el backend se despliega con variables de entorno sobreescribiendo properties,
verificar que esas variables también estén seteadas en el entorno de producción.

### 1.4 Limpiar `computadoras.txt` del repo

```bash
# Agregar al .gitignore
echo "computadoras.txt" >> .gitignore

# Limpiar historial (requiere git filter-repo instalado)
pip install git-filter-repo
git filter-repo --path computadoras.txt --invert-paths

# Si el repo tiene remote, hacer force push (coordinar con el equipo)
git push origin --force --all
```

> Si el repo alguna vez fue público o el AnyDesk ID `1809016746` fue expuesto,
> cambiar la contraseña de AnyDesk en esa máquina y rotar el ID.

---

## Fase 2 — Esta semana: registro y roles

### 2.1 Diagnóstico de usuarios existentes (prerequisito de 2.4)

Antes de tocar nada de Auth, exportar la lista de usuarios:
```bash
firebase auth:export usuarios.json --format=json
```

Revisar dominios. Eso define si 2.4 es urgente o puede esperar.

### 2.2 Custom Claims de rol en Firebase Auth

```javascript
// Script Node.js, ejecutar una vez por usuario admin
const admin = require('firebase-admin');
admin.initializeApp();
await admin.auth().setCustomUserClaims(UID_DEL_USUARIO, { role: 'ADMIN' });
```

El claim queda en el token JWT y lo lee el backend sin consulta adicional.

### 2.3 Filtro de rol para `/api/admin/*` en Spring

Crear `AdminRoleFilter.java` separado de `FirebaseTokenFilter`:

```java
public class AdminRoleFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            FirebaseToken decoded = FirebaseAuth.getInstance()
                    .verifyIdToken(authHeader.substring(7));
            Object role = decoded.getClaims().get("role");
            if (!"ADMIN".equals(role)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Rol insuficiente");
                return;
            }
            chain.doFilter(request, response);
        } catch (FirebaseAuthException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token inválido");
        }
    }
}
```

Registrar en `FilterConfig.java`:
```java
@Bean
public FilterRegistrationBean<AdminRoleFilter> adminRoleFilter() {
    FilterRegistrationBean<AdminRoleFilter> bean =
        new FilterRegistrationBean<>(new AdminRoleFilter());
    bean.addUrlPatterns("/api/admin/*");
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
    return bean;
}
```

### 2.4 Restricción de dominio en Firebase Auth

> Ejecutar solo después del diagnóstico de 2.1.

Si se decide restringir a `@bacarsa`:

```javascript
// Cloud Function beforeUserCreated
exports.beforeUserCreated = functions.auth.user().beforeCreate((user) => {
    if (!user.email?.endsWith('@bacarsa.com')) {
        throw new functions.auth.HttpsError(
            'permission-denied',
            'Solo se permiten cuentas corporativas.'
        );
    }
});
```

**Advertencia:** esto bloquea registros nuevos, no invalida cuentas existentes.
Si hay cuentas de Gmail activas hoy, siguen funcionando. Para revocar acceso a
cuentas existentes hay que deshabilitarlas manualmente en la consola.

---

## Fase 3 — Hardening

### 3.1 CORS: separar dev de prod

`env-prod.yaml` actual:
```yaml
APP_CORS_ALLOWED_ORIGINS: "http://localhost:5173,https://agentebacar-inventario.web.app,..."
```

`localhost:5173` en producción permite que cualquier app corriendo localmente
en la máquina de un usuario haga requests autenticados al backend de prod.
No es un vector de ataque remoto, pero es descuido de configuración.

Crear `env-prod.yaml` sin localhost y `env-dev.yaml` con localhost.

### 3.2 Logs de auditoría para comandos remotos

Cuando el endpoint `POST /api/computadoras/{uuid}/comando` esté implementado,
registrar cada ejecución:

```java
// Campos mínimos en cada log
Map<String, Object> audit = new HashMap<>();
audit.put("uid", decoded.getUid());
audit.put("email", decoded.getEmail());
audit.put("accion", comando);
audit.put("target_uuid", uuid);
audit.put("timestamp", Timestamp.now());
// Escribir en colección audit_logs con Admin SDK
```

### 3.3 Rate limiting en endpoints de comando

Bucket4j es suficiente sin infraestructura adicional:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
```

Límite razonable: 10 comandos por token por minuto en `/api/computadoras/{uuid}/comando`.

---

## Archivos a modificar

| Archivo | Cambio | Fase |
|---|---|---|
| `inventario/firestore.rules` | Rules completas nuevas | 1.1 |
| `inventario-front/src/hooks/useComandoHW.js` | Reemplazar setDoc() por apiFetch() | 1.2 |
| `inventario/src/main/resources/application.properties` | allow-http=false en prod | 1.3 |
| `.gitignore` | Agregar computadoras.txt | 1.4 |
| `inventario/src/main/java/.../security/AdminRoleFilter.java` | Nuevo filtro | 2.3 |
| `inventario/src/main/java/.../config/FilterConfig.java` | Registrar AdminRoleFilter | 2.3 |
| `inventario/env-prod.yaml` | Sacar localhost de CORS | 3.1 |

---

## Lo que este plan no resuelve

- **Rotación del serviceAccountKey.json:** si alguna vez fue commiteado (aunque
  sea en una rama borrada), debería rotarse. Verificar el historial completo de git.
- **Seguridad del agente en el endpoint de la PC:** el agente C# recibe comandos
  de Firestore y los ejecuta. Si el comando `ACTUALIZAR_AGENTE` descarga un ejecutable
  de una URL configurable, esa URL debería estar hardcodeada o verificada con
  firma digital — no tomada de un campo en Firestore que alguien podría modificar.
  Eso está fuera del scope de este plan pero es un vector real.
- **Exposición del projectId:** el projectId `devbac-42d14` está en múltiples
  archivos del repo. Eso es normal y esperado en proyectos Firebase — no es un
  secreto. La seguridad no puede depender de que sea desconocido.

