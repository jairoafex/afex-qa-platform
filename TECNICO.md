# Afex+ QA Platform — Documento Técnico

Referencia técnica completa para desarrolladores que trabajen en el proyecto.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.x |
| Lenguaje | TypeScript | 5.3.x |
| ORM | Prisma | 5.8.x |
| Base de datos (dev) | SQLite | — |
| Base de datos (prod) | Preparado para PostgreSQL/AWS RDS | — |
| Autenticación | NextAuth.js v4 + Prisma Adapter | 4.24.x |
| Estilos | Tailwind CSS | 3.4.x |
| Formularios | React Hook Form + Zod | — |
| Gráficos | Recharts (dynamic import) | 2.10.x |
| IA | OpenAI SDK | 4.24.x |
| Exportación Excel | xlsx | 0.18.x |
| Exportación PDF | jspdf | 2.5.x |
| Iconos | Lucide React | 0.312.x |
| Compilador dev | Turbopack (`next dev --turbo`) | — |
| Compilador prod | SWC (vía `next build`) | — |

---

## Estructura de directorios

```
qa-platform-afex/
├── prisma/
│   ├── schema.prisma       # Esquema completo de la BD
│   ├── seed.ts             # Seed general (sistemas, módulos, usuarios demo)
│   ├── seed-developers.ts  # Seed de developers y QA engineers
│   └── dev.db              # Base de datos SQLite local (gitignored en prod)
├── public/
│   └── uploads/            # Evidencias y archivos adjuntos subidos
├── src/
│   ├── middleware.ts        # Protección de rutas (NextAuth)
│   ├── app/
│   │   ├── layout.tsx       # Root layout (fuente Inter, Providers)
│   │   ├── providers.tsx    # SessionProvider + ToastProvider
│   │   ├── page.tsx         # Redirect automático login/dashboard
│   │   ├── globals.css      # Variables CSS global, clases utilitarias Tailwind
│   │   ├── api/             # Todos los endpoints (Route Handlers)
│   │   ├── dashboard/       # Página dashboard
│   │   ├── test-plans/      # CRUD planes de prueba
│   │   ├── test-cases/      # Vista global de casos
│   │   ├── generate/        # Generación IA
│   │   ├── metrics/         # Métricas y reportes
│   │   ├── settings/        # Configuración del sistema
│   │   └── login/           # Página de login
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx   # Layout con sidebar y header
│   │   ├── charts/
│   │   │   ├── DashboardChartsSection.tsx  # Gráficos del dashboard (recharts)
│   │   │   └── MetricsChartsSection.tsx    # Gráficos de métricas (recharts)
│   │   ├── SearchableSelect.tsx     # Select con búsqueda en tiempo real
│   │   └── NotificationBell.tsx     # Bell de notificaciones con polling
│   ├── lib/
│   │   ├── prisma.ts         # Singleton de PrismaClient
│   │   ├── auth-options.ts   # Configuración NextAuth (credentials + Prisma adapter)
│   │   ├── auth.ts           # Helper getServerSession
│   │   ├── toast-context.tsx # Context global de toasts y confirmaciones
│   │   └── utils.ts          # cn(), formatDate(), getStatusColor(), etc.
│   └── types/
│       └── index.ts          # Tipos TypeScript compartidos
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env                      # Variables de entorno (no commitear)
```

---

## API Routes (Route Handlers)

Todas las rutas usan el App Router de Next.js (`src/app/api/`). Patrón de respuesta estándar:

```ts
// Éxito
{ success: true, data: ... }

// Error
{ success: false, error: "mensaje" }
```

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| ANY | `/api/auth/[...nextauth]` | Handlers NextAuth (signin, signout, session) |
| POST | `/api/auth/register` | Registro de nuevo usuario |

### Planes de prueba
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/casos` | Listar planes (paginado, filtros) |
| POST | `/api/casos` | Crear plan |
| GET | `/api/casos/[id]` | Obtener plan por ID |
| PUT | `/api/casos/[id]` | Editar plan |
| DELETE | `/api/casos/[id]` | Eliminar plan |

### Casos de prueba
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/test-cases` | Listar casos (filtros, paginación, exports) |
| POST | `/api/test-cases` | Crear caso |
| GET | `/api/test-cases/[id]` | Obtener caso por ID |
| PUT | `/api/test-cases/[id]` | Editar caso |
| DELETE | `/api/test-cases/[id]` | Eliminar caso |
| POST | `/api/test-cases/[id]/duplicate` | Duplicar caso |

### Parametrización
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/systems` | Sistemas |
| GET/POST | `/api/modules` | Módulos |
| GET/POST/PUT/DELETE | `/api/celulas` | Células |
| GET/POST/PUT/DELETE | `/api/celulas/[id]` | Célula por ID |
| GET/POST/PUT/DELETE | `/api/developers` | Developers |
| GET/POST/PUT/DELETE | `/api/developers/[id]` | Developer por ID |
| GET/POST/PUT/DELETE | `/api/qas` | QA Engineers |
| GET/POST/PUT/DELETE | `/api/qas/[id]` | QA Engineer por ID |

### Dashboard y métricas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard/stats` | Estadísticas del dashboard con filtros |

### Utilidades
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/upload` | Subir archivos (multer-like con FormData) |
| GET | `/api/export` | Exportar casos (xlsx, csv, feature) |
| GET/POST | `/api/notifications` | Notificaciones del sistema |
| POST | `/api/ai/generate` | Generación de casos con OpenAI |

---

## Variables de entorno

Copiar `.env.example` como `.env` y completar los valores:

```env
# Base de datos
DATABASE_URL="file:./dev.db"           # SQLite local en dev

# NextAuth
NEXTAUTH_SECRET="string-aleatorio-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# JWT adicional (para tokens propios)
JWT_SECRET="string-aleatorio"

# OpenAI (opcional, solo para generación con IA)
OPENAI_API_KEY="sk-..."

# Google OAuth (preparado, no activo aún)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AWS S3 (preparado para evidencias en producción)
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
```

Las variables con prefijo `NEXT_PUBLIC_` estarán expuestas al cliente. Las demás solo se leen en el servidor.

---

## Comandos disponibles

```bash
npm run dev          # Inicia servidor dev con Turbopack (http://localhost:3000)
npm run build        # Build de producción (SWC + minificación)
npm run start        # Inicia servidor en modo producción
npm run lint         # ESLint
npm run type-check   # TypeScript sin emitir archivos

npm run db:push      # Aplica el schema Prisma a la BD sin migración
npm run db:studio    # Abre Prisma Studio (GUI de la BD)
npm run db:seed      # Seed principal (sistemas, módulos, usuario demo)
```

> Para el seed de developers y QA engineers: `npx tsx prisma/seed-developers.ts`

---

## Autenticación y sesión

El flujo de autenticación usa **NextAuth.js v4** con el provider `Credentials`:

1. Usuario envía email + contraseña a `/api/auth/callback/credentials`.
2. NextAuth verifica contra la tabla `users` en Prisma (bcryptjs para el hash).
3. Se genera una sesión JWT. El secreto viene de `NEXTAUTH_SECRET`.
4. El middleware (`src/middleware.ts`) protege todas las rutas excepto `/login` y `/api/auth/*`.

La sesión incluye: `id`, `email`, `name`, `role`. Para acceder en server components:
```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
const session = await getServerSession(authOptions)
```

En client components:
```ts
import { useSession } from 'next-auth/react'
const { data: session, status } = useSession()
```

---

## Convenciones de código

### Manejo de errores en API routes
```ts
try {
  // lógica
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('contexto:', error)
  return NextResponse.json({ success: false, error: 'mensaje' }, { status: 500 })
}
```

### Consultas a Prisma
- Siempre usar el singleton: `import prisma from '@/lib/prisma'`
- No instanciar `new PrismaClient()` directamente en ningún otro archivo.

### Estilos
- Usar `cn()` de `@/lib/utils` para combinar clases Tailwind de forma condicional.
- Las clases utilitarias de la UI (`.card`, `.btn-primary`, `.input-field`) están definidas en `globals.css`.
- Color principal: `afex-green` (#5cb85c) definido en `tailwind.config.ts`.

### Imports de recharts
- **No importar recharts directamente en páginas.** Usar los componentes en `src/components/charts/` con `dynamic(..., { ssr: false })` para no bloquear el bundle inicial.

### Fuentes
- Inter desde `next/font/google` con `display: 'swap'` para evitar render blocking.

---

## Configuración de Next.js (`next.config.js`)

```js
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // removeConsole solo en producción (incompatible con Turbopack en dev)
  ...(process.env.NODE_ENV === 'production' ? {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } }
  } : {}),
  images: {
    domains: ['localhost'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}
```

---

## Consideraciones de escalabilidad

- **Base de datos**: SQLite en dev. Para producción reemplazar `DATABASE_URL` por una cadena PostgreSQL (RDS), sin cambios de código gracias a Prisma.
- **Almacenamiento de archivos**: actualmente en `public/uploads/` (local). Migrar a AWS S3 cambiando el handler de `/api/upload`.
- **Compilador**: Turbopack en dev, SWC en producción. No usar `compiler.removeConsole` en el scope de Turbopack.
- **Bundle**: los gráficos (recharts) y exportaciones pesadas (xlsx, jspdf) están en lazy chunks separados para mantener el bundle inicial liviano.
