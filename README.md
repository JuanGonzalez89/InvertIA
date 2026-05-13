# InvertIA - AI Portfolio Manager

InvertIA es un gestor de portafolio inteligente enfocado en el mercado argentino. La aplicación combina un dashboard financiero con un asistente de IA capaz de analizar contexto, consultar información de mercado y ayudar a gestionar una cartera de inversiones de forma más rápida y clara.

InvertIA es un sistema avanzado de gestión de portafolios financieros diseñado para el mercado argentino, integrando inteligencia artificial para el análisis de activos y soporte en la toma de decisiones. Este proyecto aplica arquitecturas modernas de desarrollo web y procesamiento de lenguaje natural para ofrecer una experiencia profesional a inversores locales.

## Qué hace el proyecto

InvertIA centraliza la visualización y gestión de inversiones con foco en:

- Seguimiento de cartera con métricas de valor, rendimiento y movimientos.
- Exploración de mercado para activos locales y CEDEARs.
- Registro e importación de operaciones.
- Asistencia conversacional con IA para explicar decisiones y trabajar con contexto financiero.

La idea no es solo mostrar datos, sino convertir la información en un flujo de trabajo útil para tomar decisiones con más contexto.

## Funcionalidades principales

- Dashboard financiero con vistas de resumen, cartera, mercado y movimientos.
- Componente de IA para consultas y análisis contextual.
- Integración preparada para herramientas externas mediante Model Context Protocol (MCP).
- Gestión pensada para el mercado argentino, con foco en activos cotizados en pesos.
- Autenticación y perfil de usuario para personalizar la experiencia.

## Stack tecnológico

- Frontend: Next.js con App Router, React y Tailwind CSS.
- Estado y UI: Zustand y componentes reutilizables.
- IA: Vercel AI SDK, Vercel AI Gateway y herramientas de lenguaje.
- Integraciones: Model Context Protocol (MCP) para conectar datos externos.
- Base de datos: Prisma.
- Deploy: Vercel.

## Estructura general

La aplicación está organizada como un dashboard multipágina:

- `/`: Resumen general del portafolio.
- `/cartera`: Vista detallada de tenencias y gestión de activos.
- `/mercado`: Exploración y búsqueda de instrumentos.
- `/movimientos`: Historial y exportación de operaciones.
- `/chat`: Asistente conversacional con contexto de cartera.
- `/perfil`: Datos y configuración del usuario.

## Enfoque de arquitectura

- La capa de servicios concentra la lógica de negocio y acceso a datos.
- Los componentes de UI consumen servicios, no APIs directamente.
- El contexto de cartera se usa para enriquecer las respuestas de IA.
- La app prioriza consistencia de datos, especialmente en activos y divisas del mercado argentino.

## Desarrollo local

Instalación:

```bash
pnpm install
```

Ejecutar en modo desarrollo:

```bash
pnpm dev
```

Compilar para producción:

```bash
pnpm build
```

Levantar la versión compilada:

```bash
pnpm start
```

## Variables de entorno

El proyecto utiliza variables como:

- `AI_GATEWAY_API_KEY`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Usá un archivo `.env.local` para configurarlas en desarrollo.

## Equipo

- Juan Ignacio Gonzalez Caceres
- Juan Pablo Garcia
- Santiago Calderon

## Estado del proyecto

Proyecto en desarrollo activo.
