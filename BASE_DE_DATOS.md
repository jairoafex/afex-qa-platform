# Afex+ QA Platform — Base de Datos

Esquema completo de la base de datos. En desarrollo se usa **SQLite** (archivo `prisma/dev.db`). El ORM es **Prisma** y el esquema fuente está en `prisma/schema.prisma`.

Para producción solo se requiere cambiar `DATABASE_URL` a una cadena PostgreSQL; el schema Prisma es compatible sin modificaciones.

---

## Resumen de tablas

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema (QA, Admin, Viewer) |
| `systems` | Sistemas o productos gestionados (ej: Afex+, Connect) |
| `modules` | Módulos dentro de un sistema |
| `components` | Componentes dentro de un módulo |
| `services` | Servicios transversales |
| `test_plans` | Planes de prueba asociados a tareas Jira |
| `test_cases` | Casos de prueba individuales |
| `attachments` | Archivos adjuntos (evidencias) de un caso |
| `comments` | Comentarios en un caso de prueba |
| `change_logs` | Historial de cambios de un caso |
| `configurations` | Configuraciones clave-valor del sistema |
| `developers` | Desarrolladores responsables de historias |
| `celulas` | Células (equipos de trabajo) |
| `qa_engineers` | Ingenieros QA asignados a planes |
| `audit_logs` | Log de auditoría de acciones del sistema |

---

## Detalle de tablas

### `users`
Usuarios que acceden a la plataforma.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | Identificador único |
| `email` | String UNIQUE | Email de login |
| `name` | String | Nombre completo |
| `password` | String | Hash bcrypt |
| `role` | String | Default: `QA`. Valores: ADMIN, QA, VIEWER, DEVELOPER |
| `avatar` | String? | URL de avatar |
| `googleId` | String? UNIQUE | Preparado para Google OAuth |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |
| `lastLogin` | DateTime? | Último acceso |

---

### `systems`
Sistemas o productos gestionados (ej: Afex+, Connect, Pullman).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String UNIQUE | Nombre del sistema |
| `description` | String? | — |
| `color` | String? | Color hex para UI |
| `icon` | String? | Ícono identificador |
| `isActive` | Boolean | Default: true |
| `createdAt` / `updatedAt` | DateTime | — |

---

### `modules`
Módulos dentro de un sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String | Nombre del módulo |
| `description` | String? | — |
| `systemId` | FK → systems | Sistema al que pertenece |
| `isActive` | Boolean | Default: true |

**Unique constraint**: `(systemId, name)` — no puede haber dos módulos con el mismo nombre dentro del mismo sistema.

---

### `components`
Componentes dentro de un módulo (nivel de granularidad opcional).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String | — |
| `moduleId` | FK → modules | Cascade delete |
| `isActive` | Boolean | — |

---

### `services`
Servicios transversales independientes de la jerarquía sistema/módulo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String UNIQUE | — |
| `endpoint` | String? | URL del servicio |
| `isActive` | Boolean | — |

---

### `test_plans`
Plan de prueba. Contenedor principal de casos. Asociado a una tarea Jira.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `jiraTask` | String | Ej: `AFEX-1234` |
| `description` | String | Descripción del plan |
| `epic` | String? | Épica Jira asociada |
| `systemId` | FK → systems? | Sistema (opcional) |
| `moduleId` | FK → modules? | Módulo asociado |
| `userId` | FK → users | Creador del plan |
| `celulaId` | FK → celulas? | Célula responsable |
| `developerId` | FK → developers? | Desarrollador de la historia |
| `qaId` | FK → qa_engineers? | QA asignado |
| `relatedJiraTasks` | String? | JSON array de tareas relacionadas |
| `status` | String | Default: `CREATED`. Valores: DRAFT, IN_PROGRESS, COMPLETED, CANCELLED |
| `totalCases` | Int | Contador total de casos |
| `completedCases` | Int | Casos en estado final |
| `createdAt` / `updatedAt` | DateTime | — |

**Índices**: `(systemId, status)`, `(userId)`, `(userId, createdAt)`, `(status, createdAt)`

---

### `test_cases`
Caso de prueba individual. Siempre pertenece a un `test_plan`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | ID interno del sistema |
| `caseId` | String | ID visible (ej: `TC-001`), único por plan |
| `name` | String | Nombre corto del caso |
| `description` | String? | Descripción del escenario |
| `preconditions` | String? | Condiciones previas |
| `steps` | String? | Pasos de ejecución |
| `expectedResult` | String? | Resultado esperado |
| `actualResult` | String? | Resultado real obtenido |
| `observations` | String? | Notas adicionales |
| `finalResult` | String? | Evaluación final del QA |
| `priority` | String | CRITICAL, HIGH, MEDIUM, LOW |
| `testType` | String | FUNCTIONAL, INTEGRATION, REGRESSION, SMOKE, E2E, API, PERFORMANCE, SECURITY, USABILITY |
| `status` | String | PENDING, IN_PROGRESS, PASSED, FAILED, BLOCKED, SKIPPED, NOT_APPLICABLE, CANCELLED, OUT_OF_SCOPE |
| `platform` | String? | Web, Mobile, API, Desktop |
| `gherkinScenario` | String? | Escenario en formato Gherkin |
| `tags` | String? | JSON array serializado: `'["smoke","regression"]'` |
| `testPlanId` | FK → test_plans | Plan al que pertenece (cascade delete) |
| `systemId` | String? | Referencia al sistema (desnormalizado del plan) |
| `moduleId` | FK → modules? | Módulo asociado |
| `componentId` | FK → components? | Componente asociado (opcional) |
| `serviceId` | FK → services? | Servicio asociado (opcional) |
| `userId` | FK → users | Creador |
| `dependsOnCaseId` | FK → test_cases? | Auto-relación: dependencia de otro caso |
| `createdAt` / `updatedAt` | DateTime | — |
| `executedAt` | DateTime? | Se setea automáticamente al llegar a PASSED/FAILED/BLOCKED/OUT_OF_SCOPE |

**Unique constraint**: `(testPlanId, caseId)`

**Índices**: `(testPlanId)`, `(status)`, `(systemId, moduleId)`, `(executedAt)`, `(createdAt)`, `(testPlanId, status)`, `(userId, createdAt)`, `(status, priority)`, `(testType, status)`

---

### `attachments`
Archivos adjuntos (evidencias) de un caso de prueba.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `fileName` | String | Nombre del archivo original |
| `fileType` | String | MIME type (ej: `image/png`) |
| `fileSize` | Int | Tamaño en bytes |
| `filePath` | String | Ruta relativa en `public/uploads/` |
| `testCaseId` | FK → test_cases | Cascade delete |
| `uploadedBy` | String | ID del usuario que subió el archivo |
| `createdAt` | DateTime | — |

---

### `comments`
Comentarios colaborativos en un caso de prueba.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `content` | String | Texto del comentario |
| `testCaseId` | FK → test_cases | Cascade delete |
| `userId` | FK → users | Autor |
| `createdAt` / `updatedAt` | DateTime | — |

---

### `change_logs`
Historial de cambios de un caso de prueba (auditoría interna de QA).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `message` | String | Descripción del cambio |
| `testCaseId` | FK → test_cases | Cascade delete |
| `userId` | FK → users | Usuario que realizó el cambio |
| `createdAt` | DateTime | — |

**Índices**: `(testCaseId)`, `(createdAt)`

---

### `configurations`
Configuraciones del sistema almacenadas como clave-valor.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `key` | String UNIQUE | Clave de configuración |
| `value` | String | Valor |
| `type` | String | `string`, `number`, `boolean`, `json` |
| `category` | String | `general`, `integration`, `ai`, `notifications` |

---

### `developers`
Desarrolladores responsables de historias de usuario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String UNIQUE | Nombre completo |
| `email` | String? | Email de contacto |
| `area` | String? | Frontend, Backend, QA, DevOps, etc. |
| `celulaId` | FK → celulas? | Célula a la que pertenece |
| `isActive` | Boolean | — |

---

### `celulas`
Equipos de trabajo o células.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String UNIQUE | Nombre de la célula |
| `isActive` | Boolean | — |

Relaciones: tiene `developers`, `qaEngineers` y `testPlans` asociados.

---

### `qa_engineers`
Ingenieros QA que pueden ser asignados a planes de prueba.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `name` | String | Nombre completo |
| `email` | String? | — |
| `celulaId` | FK → celulas? | Célula a la que pertenece |
| `isActive` | Boolean | — |

---

### `audit_logs`
Log de auditoría general del sistema (acciones de usuario).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | cuid (PK) | — |
| `userId` | String? | Usuario que ejecutó la acción |
| `action` | String | Ej: `CREATE`, `UPDATE`, `DELETE` |
| `entity` | String | Ej: `TestCase`, `TestPlan` |
| `entityId` | String | ID del registro afectado |
| `changes` | String? | JSON con los cambios aplicados |
| `ipAddress` | String? | IP del cliente |
| `userAgent` | String? | Browser/agente del cliente |
| `createdAt` | DateTime | — |

---

## Jerarquía de datos

```
celulas
  └── developers (celulaId)
  └── qa_engineers (celulaId)

systems
  └── modules (systemId)
        └── components (moduleId)

test_plans (jiraTask, systemId?, moduleId?, userId, celulaId?, developerId?, qaId?)
  └── test_cases (testPlanId, moduleId?, componentId?, serviceId?, userId)
        ├── attachments
        ├── comments
        └── change_logs
```

---

## Comandos Prisma frecuentes

```bash
# Aplicar cambios del schema a la BD (dev)
npx prisma db push

# Generar cliente Prisma tras cambiar el schema
npx prisma generate

# Abrir GUI de exploración de datos
npx prisma studio

# Ejecutar seed principal
npx tsx prisma/seed.ts

# Ejecutar seed de developers/QA
npx tsx prisma/seed-developers.ts

# Ver estado de migraciones
npx prisma migrate status
```

---

## Notas para producción

1. Cambiar `provider = "sqlite"` por `provider = "postgresql"` en `schema.prisma`.
2. Actualizar `DATABASE_URL` con la cadena de conexión de PostgreSQL (AWS RDS u otro).
3. Ejecutar `npx prisma migrate deploy` en lugar de `db push`.
4. El campo `tags` en `test_cases` es un JSON serializado como String — en PostgreSQL se puede migrar a tipo `Json` nativo de Prisma para mayor eficiencia.
5. Los archivos en `public/uploads/` deben migrarse a AWS S3; actualizar el handler de `/api/upload` y las referencias de `filePath` en `attachments`.
