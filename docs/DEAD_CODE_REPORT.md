# Reporte de código muerto / basura — `MiniAgente-Inventario`

Fecha: 2026-09-15  
Alcance analizado: `inventario/inventario-front`, `inventario/functions`, backend Java `inventario/src`, y árboles legacy/top-level (`front/`, `homebacar/`, scripts sueltos, logs JVM).

## 1) Resumen ejecutivo

- **17 módulos no alcanzables** en el frontend activo (`inventario/inventario-front/src`) al trazar imports desde el entrypoint real `src/main.jsx`.
- **Frontend duplicado coexistente**:
  - app activa en JS (`main.jsx` + `App.jsx`)
  - app paralela en TS no cableada (`main.tsx` + `App.tsx` + componentes demo).
- **Cloud Functions sin exports deployables** en `inventario/functions/index.js` (0 triggers exportados).
- **2 clases Java con alta probabilidad de código muerto** (`Sesion`, `TipoPeriferico`) sin referencias internas.
- **Basura claramente no-fuente trackeada en git**:
  - 9 logs de crash JVM (`hs_err_pid*`, `replay_pid*`),
  - artefactos `.firebase` de debug/cache en `inventario/` y `homebacar/`.
- **Árboles legacy grandes** probablemente abandonados:
  - `front/` (71 archivos trackeados, incluye `version v1 409` + `.zip`),
  - `inventario/inventario-front/gestión-de-inventario-it/` (24 archivos trackeados),
  - `homebacar/` (5 archivos trackeados, con logs de emulador).

## 2) Método aplicado (detección, no borrado masivo)

1. Mapeo de entrypoints/configs:
   - Hosting: `inventario/firebase.json` (`public: "public"`).
   - Front Vite activo: `inventario/inventario-front/index.html` -> `src/main.jsx`.
   - Backend Java: `InventarioApplication` + `@SpringBootApplication`.
   - Functions: `inventario/functions/package.json` (`main: index.js`).
2. Trazado de imports/rutas desde `src/main.jsx` y `App.jsx`.
3. Búsqueda de referencias en repo para scripts/árboles legacy.
4. Clasificación por confianza: **HIGH** / **LIKELY** / **KEEP**.

---

## 3) Hallazgos HIGH confidence (muerto o basura clara)

### 3.1 Frontend activo (`inventario/inventario-front/src`)

Estos módulos no son alcanzables desde `src/main.jsx`:

| Ruta | Motivo |
|---|---|
| `inventario/inventario-front/src/main.tsx` | Entry TS no referenciado por `index.html` activo. |
| `inventario/inventario-front/src/App.tsx` | Solo referenciado por `main.tsx` (también muerto). |
| `inventario/inventario-front/src/mockData.ts` | Solo consumido por `App.tsx` muerto. |
| `inventario/inventario-front/src/types.ts` | Solo consumido por `App.tsx` muerto. |
| `inventario/inventario-front/src/components/AssetsList.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/Assignments.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/ComputadorasList.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/Dashboard.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/ReportsView.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/StockList.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/UsersList.tsx` | Cadena de uso cuelga de `App.tsx` muerto. |
| `inventario/inventario-front/src/components/NavIcon.jsx` | Sin importadores en app activa. |
| `inventario/inventario-front/src/constants/estados.js` | Sin importadores (ya no participa en rutas/layout actual). |
| `inventario/inventario-front/src/constants/topicos.js` | Sin importadores (sidebar actual no usa `TOPICOS`). |
| `inventario/inventario-front/src/hooks/useTareasHW.js` | Hook exportado sin consumo. |
| `inventario/inventario-front/src/lib/navIcons.js` | Helper exportado sin consumo. |
| `inventario/inventario-front/src/pages/ColaboradoresList.jsx` | Página existente pero no importada en `App.jsx` ni ruteada. |

> Nota: se detectaron además exports aislados sin consumo en módulos vivos (principalmente funciones API “de más”), pero se clasifican como **LIKELY** para evitar falsos positivos.

### 3.2 Cloud Functions

| Ruta | Motivo |
|---|---|
| `inventario/functions/index.js` | `package.json` apunta aquí como `main`, pero no exporta ninguna función (`exports.*` inexistente). |

### 3.3 Backend Java

| Ruta | Motivo |
|---|---|
| `inventario/src/main/java/com/bacarsa/inventario/models/Sesion.java` | Clase definida sin referencias en código Java del proyecto. |
| `inventario/src/main/java/com/bacarsa/inventario/models/TipoPeriferico.java` | Enum definido sin referencias en código Java del proyecto. |

### 3.4 Basura no-fuente (trackeada)

| Ruta | Motivo |
|---|---|
| `inventario/hs_err_pid*.log` (7 archivos) | Crash dumps JVM, no son código fuente. |
| `inventario/replay_pid*.log` (2 archivos) | Logs de replay JVM, no son código fuente. |
| `inventario/.firebase/hosting.cHVibGlj.cache` | Cache local de Firebase CLI. |
| `inventario/.firebase/logs/vsce-debug.log` | Log local de emulador/CLI. |
| `homebacar/.firebase/hosting.cHVibGlj.cache` | Cache local de Firebase CLI. |
| `homebacar/.firebase/logs/vsce-debug.log` | Log local de emulador/CLI. |

---

## 4) Hallazgos LIKELY dead (requieren validación humana)

| Ruta | Motivo de sospecha |
|---|---|
| `inventario/inventario-front/gestión-de-inventario-it/` (24 archivos) | App sandbox independiente (`react-example`) sin referencias desde scripts/config del frontend activo. |
| `front/` (71 archivos trackeados) | Árbol legacy paralelo, incluye copia `version v1 409` y archivos sueltos duplicados (`*.tsx`, `types (1).ts`). |
| `front/version v1 409/gestión-de-inventario-it.zip` | Snapshot empaquetado dentro del repo (artefacto, no fuente activa). |
| `homebacar/` (`firebase.json`, `public/index.html`, `.firebaserc`) | Segundo hosting target fuera del flujo principal `inventario`; parece residuo de pruebas/migración. |
| `inventario/fix_bugs.js`, `fix_fields.js`, `fix_grid.js`, `fix_grid2.js`, `fix_hooks.js`, `fix_vida.js`, `inject.js` | Scripts one-shot con rutas hardcodeadas Windows (`D:/Desarrollo/...`), sin references en scripts npm/CI. |
| `inventario/functions/check_type.js`, `inventario/functions/fix_fecha.js` | Scripts manuales de mantenimiento Firestore, sin wiring en npm scripts. |
| `inventario/functions/bootstrap_admin.js` | Utilidad manual válida, pero no integrada al flujo de deploy/runtime; decidir si mover a `scripts/manual/`. |

### Exports probablemente no usados (muestra)

Candidatos detectados por análisis estático en frontend vivo:
- `api/routerApi.js`: `deleteRouter`
- `api/switchApi.js`: `deleteSwitch`
- `api/accessPointApi.js`: `deleteAccessPoint`
- `api/usuarioApi.js`: `fetchUsuario`, `lookupUsuarioAuth`
- `api/camaraApi.js`: `fetchHistorialCamara`
- `hooks/useCatalogo.js`: `useLabelUbicacionComputadora`

> Recomendación: confirmar con búsqueda de uso en branches activos y/o telemetría de rutas antes de eliminar exports públicos.

---

## 5) KEEP (parece vivo / cableado)

| Ruta/patrón | Razón para conservar |
|---|---|
| `inventario/inventario-front/index.html` + `src/main.jsx` + `src/App.jsx` | Punto de entrada/ruteo real del frontend productivo. |
| `inventario/public/` | Destino de build para Firebase Hosting (`firebase.json` usa `public`). |
| `inventario/src/main/java/com/bacarsa/inventario/controller/**` | Endpoints REST expuestos por Spring (cargados por component scan). |
| `inventario/src/main/java/com/bacarsa/inventario/config/{CorsConfig,FilterConfig,CacheConfig,FirebaseConfig}.java` | Configuración viva por anotaciones/beans (aunque tengan pocas referencias nominales). |
| `inventario/src/main/java/com/bacarsa/inventario/security/**` | Filtros registrados por `FilterConfig` bajo `app.security.firebase-filter.enabled=true`. |
| `inventario/scripts/*.py` | Scripts utilitarios explícitos para migración/importación (sin señales de ser basura). |

---

## 6) Orden sugerido de limpieza segura (menor riesgo -> mayor riesgo)

1. **Basura no-fuente obvia**  
   Eliminar logs JVM y artefactos `.firebase` trackeados.

2. **Scripts one-shot con rutas hardcodeadas**  
   Mover a carpeta `scripts/legacy/` o borrar tras snapshot.

3. **Frontend no alcanzable en app activa**  
   Retirar primero `main.tsx`, `App.tsx`, `mockData.ts`, `types.ts`, `pages/ColaboradoresList.jsx`, `constants/topicos.js`, etc.

4. **`functions/index.js` sin exports**  
   Decidir: (a) definir triggers reales o (b) deprecar `inventario/functions` si solo quedan scripts manuales.

5. **Clases Java huérfanas**  
   Borrar `Sesion` y `TipoPeriferico` tras `mvn test` en branch de limpieza.

6. **Árboles legacy grandes (`front/`, `homebacar/`, `gestión-de-inventario-it/`)**  
   Validar con equipo si se preservan como backup histórico; idealmente reemplazar por tag/release y sacar del trunk.

---

## 7) Top 10 hallazgos prioritarios

1. `inventario/inventario-front/src/main.tsx` muerto (entrypoint no usado).  
2. `inventario/inventario-front/src/App.tsx` muerto (solo lo llama `main.tsx`).  
3. `inventario/inventario-front/src/pages/ColaboradoresList.jsx` huérfana (sin ruta/import).  
4. 10+ componentes TSX en `src/components/*` colgados de `App.tsx` muerto.  
5. `inventario/functions/index.js` sin `exports.*` (deploy Functions no expone triggers).  
6. `models/Sesion.java` sin referencias en backend Java.  
7. `models/TipoPeriferico.java` sin referencias en backend Java.  
8. 9 logs JVM (`hs_err*/replay*`) trackeados en git.  
9. `front/` con 71 archivos legacy/duplicados, incluyendo `.zip` dentro del repo.  
10. `homebacar/` + artefactos `.firebase` trackeados, separados del flujo principal.

