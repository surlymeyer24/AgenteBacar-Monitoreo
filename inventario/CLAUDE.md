# CLAUDE.md — Proyecto `inventario` (Backend Java)

Instrucciones y contexto que Claude Code carga automáticamente al abrir este proyecto.

---

## 1. Resumen del proyecto

Backend Java del sistema de inventario IT de Bacarsa. Consume datos que un **agente C# separado (CyberWatch / AgenteBacar)** escribe en Firestore desde cada PC de la empresa, y los expone vía API REST para un frontend web.

- **Este repo:** backend Java (`inventario/`).
- **Proyecto hermano (separado):** agente C# CyberWatch (no está en este repo).
- **Frontend planeado:** React/Vite en `inventario-front/` (sibling, aún no creado).

Ver `README.md` para el diseño completo y `diagrama-clases.puml` para el modelo de dominio.

---

## 2. Stack

- **Java 21**, **Spring Boot 3.5.13**
- **Maven** con wrapper (`mvnw` / `mvnw.cmd`)
- **Firebase Admin SDK 9.2.0** → Firestore como base de datos
- **Lombok**
- **Mappers manuales** (no se usa MapStruct)
- Spring DevTools (hot reload en dev)

---

## 3. Estructura de paquetes

`src/main/java/com/bacarsa/inventario/`

| Paquete | Contenido |
|---|---|
| `config` | Configuración Spring (CORS, etc.) |
| `controller` | Endpoints REST |
| `db` | Configuración Firebase/Firestore |
| `dto` | Data Transfer Objects para la API |
| `mapper` | Conversores manuales Entity ↔ DTO |
| `models` | Entidades de dominio (`Computadora`, `Camara`, jerarquía `ComponenteHW` → `Disco`/`Ram`/`Procesador`/`Periferico`, `Estado`, `CambioEstado`, enums) |
| `repository` | Acceso a Firestore |
| `security` | (reservado) |

---

## 4. Comandos

```bash
./mvnw compile              # compilar
./mvnw spring-boot:run      # correr local
./mvnw clean install        # build completo (con tests)
```

En Windows usar `mvnw.cmd`.

---

## 5. Convenciones

- **Idioma:** español para nombres de clases, variables, enums y documentación (`Computadora`, `ubicacion`, `ADMINISTRACION`, etc.).
- **Mapeo Firestore:** usar `@PropertyName("snake_case")` en modelos para mapear campos de Firestore.
- **Mappers:** manuales, con null checks explícitos (no autogenerados).
- **Credenciales:** `serviceAccountKey.json` va en `src/main/resources/auth/` y **nunca** se commitea (ya está en `.gitignore`).
- **IDs:** cada entidad de dominio persistida debe tener `String id` (pendiente — ver memoria del usuario).

---

## 6. Reglas operativas

Detalle completo en [`CLAUDE_RULES.md`](./CLAUDE_RULES.md). Resumen:

- **Discutir antes de implementar** cualquier cambio. Explicar qué, por qué y cómo. Esperar aprobación explícita.
- **Scope estricto:** hacer solo el cambio pedido. No refactorizar ni "mejorar" por las tuyas.
- **Consultar `README.md`** antes de cambios grandes y **mantenerlo al día** después.
- **Verificar documentación oficial** antes de cambios técnicos (no inventar APIs).

---

## 7. Lecciones aprendidas

Detalle completo en [`CLAUDE_LESSONS.md`](./CLAUDE_LESSONS.md). Lo aplicable a este proyecto Java:

- **Firestore:** preferir operaciones de merge (`set` con merge) sobre `update` crudo para no pisar campos existentes por error.
- **Seguridad:** nunca commitear `serviceAccountKey.json`. Si se expone: revocar la clave, generar una nueva y limpiar el historial de git.

> Las notas sobre **Firebase Storage ACL** y **Machine ID / WMI** en `CLAUDE_LESSONS.md` son del agente C# CyberWatch, **no aplican** a este backend Java.

---

## 8. Deploy — ⚠️ aclaración importante

**Este proyecto (`inventario` Java) solo contempla despliegue web:**
- **Frontend** (cuando exista `inventario-front/`): **Firebase Hosting**.
- **Backend Java:** se desplegará según corresponda (a definir), no tiene aún un proceso de release formal.

El archivo [`CLAUDE_DEPLOY.md`](./CLAUDE_DEPLOY.md) documenta el proceso de release del **agente C# CyberWatch** (proyecto separado, no está en este repo) — habla de `appsettings.json`, `install.bat`, `PublishSingleFile`, etc. **Nada de eso aplica a este proyecto Java.** Ignorar ese archivo salvo que se trabaje sobre CyberWatch.

---

## 9. Estado actual / referencias vivas

- **Roadmap de la iteración en curso:** [`iteracion-1-pasos.md`](../docs/iteracion-1-pasos.md)
- **Modelo de dominio:** [`diagrama-clases.puml`](./diagrama-clases.puml)
- **Diseño general del sistema:** [`README.md`](./README.md)

Si alguno de estos archivos queda desactualizado respecto del código, avisar antes de seguir.
