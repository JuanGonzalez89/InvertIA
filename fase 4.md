# Fase 4: Integración de IA con Vercel AI SDK

Con la infraestructura de autenticación y base de datos ya establecida, esta fase se centra en dar vida al "Agente Asesor". El objetivo es conectar la aplicación a un modelo de lenguaje grande (LLM) y permitirle analizar la cartera del usuario para ofrecer recomendaciones y responder preguntas.

## 📝 Plan de Acción

1.  **Instalación y Configuración del Vercel AI SDK**:
    *   Instalar la librería `ai`.
    *   Crear el `api/chat/route.ts` que actuará como endpoint para las interacciones con el modelo de IA.

2.  **Creación de la Interfaz de Chat**:
    *   Desarrollar los componentes de React necesarios en `components/chat/` para construir una interfaz de chat funcional.
    *   Implementar la lógica en `app/chat/page.tsx` para que consuma el endpoint de la API y muestre la conversación.

3.  **Dotar de Contexto al Agente**:
    *   Modificar el endpoint `api/chat/route.ts` para que, antes de enviar la pregunta del usuario al LLM, primero obtenga la cartera del usuario (`getPortfolio(user.id)`).
    *   Inyectar los datos de la cartera como parte del "prompt" o contexto que recibe el modelo.

4.  **(Prerrequisito) Creación de Formularios de Transacciones**:
    *   Desarrollar un formulario (probablemente en un componente `Dialog`) para que los usuarios puedan registrar sus compras y ventas de activos.
    *   Crear una Server Action que reciba los datos del formulario y actualice las tablas `Transaction`, `Position` y `CashBalance` en la base de datos.

5.  **(Prerrequisito) Carga de Activos en la Base de Datos**:
    *   Crear un script de "seeding" (`prisma/seed.ts`) para poblar la tabla `Asset` con una lista inicial de instrumentos financieros (acciones, bonos, CEDEARs).

## 🎯 Objetivo Final de la Fase

Al final de esta fase, un usuario debería poder:
1.  Registrar una transacción de compra de un activo (ej. "Compré 10 acciones de AAPL").
2.  Ir a la página de "Agente".
3.  Ver su cartera reflejada en el contexto del chat.
4.  Hacer una pregunta como "¿Qué opinas de mi posición en Apple?" y recibir una respuesta coherente del agente de IA.
