InvertIA - AI Portfolio Manager 

InvertIA es una plataforma fintech moderna que combina un dashboard financiero completo con un Agente de IA autónomo. No es solo un chatbot; es un asistente operativo capaz de tomar decisiones, explicar su razonamiento y ejecutar acciones sobre tu cartera de inversiones.

Desarrollado para la hackathon global Zero to Agent de Vercel (Edición Buenos Aires).

🚀 Características Principales

Nuestro agente utiliza "Tool Calling" para interactuar directamente con la plataforma y el mundo exterior:

* Consultas en Tiempo Real: El agente lee APIs financieras vía Model Context Protocol (MCP) para obtener cotizaciones actualizadas de acciones, CEDEARs y bonos.
* Memoria y Contexto: Conciencia total sobre el estado del usuario. El agente conoce tu liquidez disponible en pesos y la composición exacta de tu cartera antes de sugerir un movimiento.
* Ejecución de Órdenes: Capacidad operativa real. Si el usuario aprueba una operación, el agente ejecuta la función que descuenta los fondos de la liquidez y acredita el activo en la cartera.
* Explicador de Decisiones: Transparencia total. Antes de sugerir la compra/venta de un activo (ej. YPF, NVDA), el agente busca noticias recientes y contexto de mercado, explicando el por qué de su recomendación.

🛠️ Stack Tecnológico

* Frontend: Next.js (App Router), React, Tailwind CSS.
* IA & Agentes: Vercel AI SDK, Vercel AI Gateway.
* Integraciones: Model Context Protocol (MCP) para conectar el LLM con fuentes de datos externas.
* Deploy: Vercel.

🗂️ Estructura de la Aplicación

La interfaz está diseñada bajo una arquitectura de dashboard profesional multipágina:
- `/`: Resumen general (Valor de cartera, rendimiento, liquidez).
- `/cartera`: Vista detallada de activos y gestión de fondos.
- `/mercado`: Screener de acciones destacadas (CEDEARs, ADRs).
- `/agente`: Terminal inmersiva del AI Portfolio Manager.

👥 Equipo de Desarrollo

* Juan Ignacio Gonzalez Caceres
* Juan Pablo Garcia
* Santiago Calderon

*Proyecto en desarrollo activo hasta el 3 de mayo de 2026.*
