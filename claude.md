# Contexto del Proyecto: InvertIA 🚀

Este archivo sirve para dar contexto a cualquier IA (Claude, Gemini, GPT) sobre la arquitectura, objetivos y convenciones de este proyecto.

## 📋 Información General
- **Nombre:** InvertIA
- **Objetivo:** Portfolio-Manager inteligente enfocado en el mercado argentino (CEDEARs, Bonos, Acciones) que utiliza agentes de IA para ayudar en la toma de decisiones financieras.
- **Evento:** Hackathon "Zero to Agent" (Vercel).
- **Track:** Track 2 - **"v0 + MCPs"** (Model Context Protocol), elegido para el hackathon "Zero to Agent".

## 🛠️ Stack Tecnológico
- **Framework:** Next.js (App Router) + React 19.
- **Estilos:** Tailwind CSS (v4).
- **Estado Global:** Zustand (solo para estado de UI y caché de cliente).
- **Autenticación:** NextAuth.js / Clerk (Fase 3).
- **IA:** Vercel AI SDK + AI Gateway (componente central para la construcción de agentes del hackathon).
- **Componentes:** Radix UI / shadcn (generados inicialmente por v0).

## 🏗️ Arquitectura (Server-First)
Para mantener el proyecto escalable a largo plazo, seguimos este patrón:

1. **`lib/types/`**: Contratos de TypeScript. Todas las interfaces de datos (Asset, Portfolio, Order) deben definirse aquí.
2. **`lib/services/`**: Lógica de negocio y obtención de datos. **Regla de oro:** Los componentes de UI nunca llaman a APIs directamente; llaman a funciones en esta carpeta.
3. **`store/`**: Stores de Zustand. Se usan únicamente para manejar estados de carga, errores y caché visual. Los datos financieros reales residen en la capa de servicios.
4. **`app/api/`**: Endpoints para el AI SDK (vía Vercel AI Gateway).

## 📈 Roadmap Profesional (InvestIA)

### ✅ Fase 1: Frontend y Estructura Base (COMPLETADA)
- UI en Dark Mode (estilo terminal financiera).
- Rutas: `/cartera`, `/mercado`, `/movimientos`, `/chat`, `/perfil`.

### 🔄 Fase 2: Arquitectura de Datos y Estado (EN PROGRESO)
- **Responsable:** Usuario Principal.
- Implementación de `portfolio.service.ts` y tipos base.
- Conexión de componentes de v0 al store de Zustand.

### 🔜 Fase 3: Sistema de Sesión y Contexto (PENDIENTE)
- **Responsable sugerido:** Juan Pablo o Santiago.
- Implementación de NextAuth/Clerk.
- El agente necesita el `userId` real para no alucinar carteras ajenas.
- Protección de rutas financieras con middleware.

### 🔜 Fase 4: El Cerebro - Vercel AI SDK (PENDIENTE)
- **Responsable sugerido:** Especialista en LLMs/Prompts.
- Setup de `app/api/chat/route.ts` con streaming.
- Implementación de las 4 tools básicas: `consultarPrecio`, `consultarMemoria`, `ejecutarOrden`, `explicarDecision`.

### 🔜 Fase 5: Conexión con el Mundo Real - MCP (PENDIENTE)
- **Responsable sugerido:** Backend/Infra.
- Creación del servidor MCP en Vercel.
- **Decisión:** Usar `yahoo-finance2` para desarrollo/demo y evaluar `Alpha Vantage` o `API IOL` para producción.
- Integración real de las tools del AI SDK con el servidor MCP.

### 🔜 Fase 6: QA, Pulido y Entrega (Deadline: 3 de mayo)
- Testeo de edge cases (falta de liquidez, tickers inexistentes).
- Variables de entorno en Vercel y Submission formal.

## 🤝 Convenciones de Desarrollo
- **Git:** Usar ramas `feat/nombre-feature`. **PROHIBIDO** pushear directo a `main` en equipo sin hacer `git pull` previo o usar PRs.
- **Commits:** Seguir [Conventional Commits](https://www.conventionalcommits.org/).
- **Privacidad:** Nunca exponer el `userId` en el cliente directamente; obtenerlo siempre desde la sesión del servidor.

## 🧠 Instrucciones para la IA
- Mantener la separación entre la capa de servicios y la capa de transporte (MCP).
- El agente debe ser autónomo: debe explicar su razonamiento y ejecutar acciones (tools).
- Priorizar la estabilidad del flujo financiero: validar liquidez antes de permitir órdenes de compra.
