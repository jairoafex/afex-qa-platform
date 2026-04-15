# Afex+ QA Platform — Documento Funcional

Plataforma web para la gestión integral del ciclo de vida de casos de prueba, diseñada para equipos QA. Permite crear planes de prueba asociados a tareas Jira, gestionar casos con seguimiento de estado, generar escenarios automáticamente con IA y visualizar métricas de calidad en tiempo real.

---

## Módulos del sistema

### 1. Autenticación
- Login con email y contraseña.
- Sesión gestionada con NextAuth.js.
- Registro de nuevos usuarios (`/api/auth/register`).
- Arquitectura preparada para Google OAuth y sistema de roles (ADMIN, QA, VIEWER, DEVELOPER).

### 2. Dashboard (`/dashboard`)
Panel central de indicadores de calidad. Muestra:

**KPIs principales**
- Total de escenarios, aprobados, fallidos, en progreso.
- Pass rate general con barra de progreso visual.
- Planes activos, bloqueados, críticos fallidos.

**Indicadores de riesgo**
- Casos de alta prioridad sin ejecutar.
- Escenarios sin pasos definidos.
- Escenarios sin evidencia adjunta.
- Velocidad promedio de ejecución (días desde creación).

**Gráficos** (cargados como componente dinámico)
- Distribución por estado (pie chart).
- Casos por prioridad (bar horizontal con colores semáforo).
- Tendencia de ejecución últimos 30 días (line chart).
- Pass rate por sistema (barra de progreso).
- Casos por tipo de prueba.
- Pass rate por célula.

**Filtros disponibles**
- Período: semana, mes, trimestre, todo el tiempo, rango personalizado.
- Caso de prueba (tarea JIRA) con búsqueda en tiempo real.
- Célula responsable.
- QA asignado (cascada según célula seleccionada).

---

### 3. Planes de Prueba (`/test-plans`)
Un plan de prueba está asociado a una tarea JIRA. Es el contenedor de los casos de prueba.

**Listado**
- Tabla paginada con búsqueda por tarea JIRA o descripción.
- Filtros por estado, sistema, célula y QA.
- Indicadores de progreso (casos completados / total).
- Acciones: ver detalle, editar, eliminar.

**Crear plan** (`/test-plans/new`)
Campos requeridos:
- Tarea JIRA (ej: `AFEX-1234`)
- Descripción
- Sistema asociado
- Módulo asociado
- Desarrollador responsable
- QA asignado
- Célula
- Épica (opcional)
- Tareas JIRA relacionadas (opcional, múltiples)

**Detalle del plan** (`/test-plans/[id]`)
- Vista completa del plan con sus casos de prueba.
- Filtros por estado, prioridad, tipo de prueba.
- Exportación del plan a XLSX.
- Agregar nuevos casos directamente desde esta vista.
- Indicadores de progreso del plan.

**Editar plan** (`/test-plans/[id]/edit`)

---

### 4. Casos de Prueba (`/test-cases`)
Vista global de todos los casos en la plataforma, independiente del plan.

**Listado**
- Filtros por estado, prioridad, tipo de prueba, sistema, módulo, rango de fechas y desarrollador.
- Búsqueda por ID de caso o nombre.
- Exportación a XLSX, CSV o archivo `.feature` (Gherkin).
- Acciones: ver detalle, editar, duplicar, eliminar.

**Campos de cada caso de prueba**
| Campo | Tipo | Descripción |
|---|---|---|
| `caseId` | Auto (ej: TC-001) | Identificador visible por plan |
| `name` | Texto | Nombre corto del caso |
| `description` | Texto | Descripción del escenario |
| `preconditions` | Texto | Condiciones previas requeridas |
| `steps` | Texto | Pasos de ejecución |
| `expectedResult` | Texto | Resultado esperado |
| `actualResult` | Texto | Resultado real obtenido |
| `finalResult` | Texto | Evaluación final |
| `observations` | Texto | Notas adicionales |
| `gherkinScenario` | Texto | Escenario en formato Gherkin |
| `priority` | Enum | CRITICAL, HIGH, MEDIUM, LOW |
| `testType` | Enum | FUNCTIONAL, INTEGRATION, REGRESSION, SMOKE, E2E, API, PERFORMANCE, SECURITY, USABILITY |
| `status` | Enum | PENDING, IN_PROGRESS, PASSED, FAILED, BLOCKED, SKIPPED, NOT_APPLICABLE, CANCELLED, OUT_OF_SCOPE |
| `platform` | Texto | Web, Mobile, API, Desktop |
| `tags` | JSON array | Etiquetas (ej: `["smoke","regression"]`) |
| `dependsOnCaseId` | Relación | Dependencia de otro caso |
| `executedAt` | Fecha | Fecha de ejecución (automática al llegar a estado final) |

**Evidencias**
- Cada caso puede tener archivos adjuntos (imágenes, documentos, videos).
- Upload a `/api/upload`, archivos almacenados en `public/uploads/`.

**Crear caso** (`/test-plans/[id]/new-case`)
- Formulario de nuevo caso dentro del contexto de un plan.
- Hereda sistema y módulo del plan padre.

**Editar caso** (`/test-cases/[id]/edit`)

**Detalle caso** (`/test-cases/[id]`)
- Vista completa con historial de cambios, comentarios y evidencias.

**Duplicar caso** (`POST /api/test-cases/[id]/duplicate`)
- Crea una copia exacta del caso con nuevo ID.

---

### 5. Generación con IA (`/generate`)
Ventana de generación automática de casos de prueba mediante OpenAI.

**Inputs del usuario**
- Historia de usuario o descripción funcional (texto libre).
- Adjuntar documentos (opcional).
- Selección de sistema y módulo.
- Tipo de prueba.

**Output generado**
El sistema genera escenarios en formato Gherkin cubriendo:
- Escenarios positivos (happy path).
- Escenarios negativos.
- Casos borde.
- Validaciones de campos.
- Pruebas de permisos.
- Pruebas de integración (si aplica).

Los casos generados pueden editarse antes de guardarse.

---

### 6. Métricas y Reportes (`/metrics`)
Análisis detallado por períodos (semana, mes, trimestre, todo el tiempo).

- KPIs: total de casos, tasa de éxito, casos fallidos, pendientes.
- Gráfico de distribución por estado (pie).
- Casos por sistema (bar apilado por aprobados/fallidos/bloqueados).
- Tendencia de ejecución 30 días (line chart).
- Tabla de detalle por tipo de prueba y prioridad.

---

### 7. Configuración (`/settings`)
Panel de parametrización del sistema.

- **Sistemas**: crear, editar, activar/desactivar sistemas (ej: Afex+, Connect, Pullman).
- **Módulos**: asociados a un sistema.
- **Células**: equipos de trabajo.
- **Developers**: desarrolladores responsables de historias.
- **QA Engineers**: ingenieros QA asignados a planes.

Todos parametrizables sin tocar código.

---

### 8. Notificaciones (`/api/notifications`)
Bell de notificaciones en el header del layout.
- Polling cada 30 segundos.
- Marca notificaciones como leídas.
- Tipos: éxito, error, alerta, info, progreso, logro.

---

## Exportaciones disponibles

| Formato | Descripción |
|---|---|
| `.xlsx` | Excel con todos los campos del caso |
| `.csv` | CSV plano |
| `.feature` | Archivo Gherkin listo para Cucumber/Behave |
| JSON | Respuesta directa del API |

---

## Flujo principal de uso

1. Ir a **Configuración** → crear sistemas, módulos, células, developers y QA engineers.
2. Ir a **Planes de Prueba** → crear un plan asociado a una tarea JIRA.
3. Dentro del plan → agregar casos manualmente o ir a **Generar** para usar IA.
4. Ejecutar los casos y actualizar su estado (PASSED, FAILED, BLOCKED, etc.).
5. Revisar **Dashboard** y **Métricas** para monitorear la calidad.
6. Exportar los resultados cuando sea necesario.

---

## Integraciones futuras previstas

- **Jira**: lectura automática de historias de usuario.
- **Slack**: notificaciones de ejecución.
- **AWS S3**: almacenamiento de evidencias en producción.
- **Google OAuth**: login social.
- **Cobertura automática**: porcentaje de automatización por módulo.
