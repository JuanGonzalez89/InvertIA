# 🚀 InvertIA - Instrucciones para GitHub Copilot

Este documento codifica las directrices arquitectónicas y de dominio para el proyecto InvertIA, asegurando consistencia, escalabilidad e integridad de datos a través de todas las sesiones de generación de código.

## 📊 Dominio Financiero - Contextualizacion Bursátil Definitiva

**Regla Cardinal**: Todos los instrumentos financieros derivativos locales deben estar invariablemente acoplados a la unidad monetaria nacional (ARS - Peso Argentino).

### Flujo de Cotización y Divisas

1. **CEDEARs (Certificados de Depósito Argentinos)**: Siempre en ARS
   - Ejemplos: AAPL.BA, MSFT.BA, GOOGL.BA, AMZN.BA
   - Son acciones internacionales negociables en BCBA en pesos

2. **Acciones Locales (BCBA)**: Siempre en ARS
   - Ejemplos: GGAL, VIST, YPF, BMA, MELI
   - Cotizadas directamente en la Bolsa de Comercio de Buenos Aires

3. **Bonos**: Pueden ser en ARS o USD, pero la presentación debe respetar su moneda original

4. **Validación Obligatoria**: Si una fuente de datos retorna activos en moneda extranjera (USD, EUR, etc.), **SE DEBE BLOQUEAR la visualización** con el mensaje estándar: **"Ticket no encontrado"**

### Implementación Técnica

- **`lib/services/market.service.ts`**: Las quotes retornan `currency` field. Los componentes consumidores DEBEN filtrar por `currency === 'ARS'`
- **`components/dashboard/market-stocks.tsx`**: Filtro obligatorio en línea de mapeo de stocks
- **`components/dashboard/summary-cards.tsx`**: Solo mostrar activos cuya divisa sea ARS

---

## 👤 Integridad de Datos Biométricos Identificatorios

**Regla Cardinal**: Se prohíben explícitamente las operaciones léxicas destructivas sobre variables que contengan parámetros de identificación de usuarios.

### Identidad del Usuario - Preservación Íntegra

1. **Nombre Completo**: SIEMPRE se interpola el valor completo sin manipulación
   - ❌ **PROHIBIDO**: `userName.split(" ")[0]` (truncamiento destructivo)
   - ✅ **OBLIGATORIO**: `{userName}` (interpolación directa)
   
   Archivos afectados:
   - `components/dashboard/welcome-banner.tsx`: Debe usar `{userName}` directamente
   - `app/cartera/page.tsx`: Title debe ser `Panel de ${user.name}`

2. **Email**: Visualizar íntegro sin transformaciones
3. **Teléfono**: Mantener formato original del usuario
4. **País/Región**: Respetar como dato atómico

### Rechazo Explícito de Truncamientos

Bajo ninguna circunstancia se debe permitir:
- `name.split(' ')[0]` - Split destructivo
- `name.substring(0, x)` - Truncamiento por índice
- `name.slice(0, y)` - Slice destructivo
- Expresiones regulares que alteren la cadena original

---

## 🔐 Modernización Continua de Parámetros de Autenticación

**Regla Cardinal**: Queda estipulada la supresión de métodos de retención o estructuras sintácticas que interactúen con métricas históricas de entidades bancarias depreciadas del esquema primario.

### Banimiento de Claves Bancarias

1. **CBU (Código Bancario Uniforme)** y **CVU (Código Virtual Uniforme)**: COMPLETAMENTE ELIMINADOS
   - ❌ **Nunca**: `cbu` en tipos, formatos, validadores, requests
   - ✅ **Estado Actual**: Ya removido del flujo de autenticación

2. **Localización de Referencias Antiguas**
   - `lib/auth/get-current-user.ts`: Tipo `AppUser` no debe tener `cbu` field
   - `app/perfil/editar/page.tsx`: Formulario de edición NO debe incluir input de CBU
   - `app/page.tsx`: Validación de perfil SOLO requiere `phone`, no `cbu`
   - `app/cartera/page.tsx`: Redirect de perfil SOLO revisa `phone`

3. **Preservación de Carga Útil Comunicativa**
   - Las claves bancarias fueron removidas, pero la serialización de:
     - Nombre
     - Teléfono
     - País
     - Email
   - ...DEBE continuar transmitiendo exitosamente al servidor

---

## 📈 Módulo HOME - Arquitectura de Resumen

### SummaryCards - Erradicación de "Liquidez"

El componente de tarjeta de "Liquidez" ha sido PURGA completamente del dashboard principal:

- ❌ **Eliminado**: `<SummaryCard label="Liquidez" ... />`
- ✅ **Presentes**: "Valor cartera", "Total invertido", "Ganancia total", "Rendimiento"

**Archivos afectados:**
- `components/dashboard/summary-cards.tsx`

---

## 💼 Módulo CARTERA - Gestión Inmutable de Importaciones

### Integridad del Ciclo de Importación

El flujo de importación de archivos CSV/Excel DEBE ejecutar:

1. **Validación Léxica**: Parseo de columnas, normalización de tipos
2. **Transformación Segura**: Conversión a estructura canónica de `PreviewRow`
3. **Sobreescritura Incondicional**: Si hay activos previos, REEMPLAZAR completamente
4. **Reactividad Posterior**: El componente que visualiza distribución analítica debe re-evaluar inmediatamente

**Archivo crítico:**
- `app/api/import/parse/route.ts`: Contiene lógica de upsert y creación de transacciones

---

## 💬 Módulo CHAT - RAG y Contexto de Cartera

### Inyección de Contexto Superficial

El endpoint `/api/chat/route.ts` DEBE:

1. **Recuperar Portfolio**: `getPortfolio(user.id)` antes de armar el prompt
2. **Serializar Estructuralmente**:
   ```
   CONTEXTO DE CARTERA DEL USUARIO:
   - Valor total: $XXX
   - Total invertido: $YYY
   - Activos: [lista de tenencias con precios]
   ```
3. **Inyectar en System Prompt**: Dentro de `systemPrompt` variable
4. **Habilitar Razonamiento**: El LLM puede ahora contextualizar recomendaciones sobre patrimonio real

**Archivos afectados:**
- `app/api/chat/route.ts`: RAG implementation

---

## 📊 Módulo MERCADO - Filtrado de Divisas Extranjeras

### Intercepción de Moneda Extranjera

En `components/dashboard/market-stocks.tsx`:

```typescript
// Filtro obligatorio en mapeo de quotes
.filter((quote) => quote.currency === 'ARS')
```

- Si NO hay ARS quotes: Mostrar "Ticket no encontrado"
- Si buscan ticker de NYSE/NASDAQ directo: Bloquear retorno de USD

---

## 📋 Módulo MOVIMIENTOS - Exportación de CSV

### Flujo de Descarga Binaria

La exportación DEBE:

1. **Generar CSV**: Transformar array de órdenes a delimitadores (`,`)
2. **Crear Blob**: `new Blob([csv], { type: 'text/csv;charset=utf-8;' })`
3. **Generar URL Efímera**: `URL.createObjectURL(blob)`
4. **Simular Click**: Crear `<a>` anónimo, vincularlo, disparar evento
5. **Limpieza**: `URL.revokeObjectURL(url)` post-descarga

**Archivo:**
- `components/dashboard/export-movements-button.tsx`: Cliente-side export logic

---

## 🔄 Flujo de Estado Global - Zustand

### Regla de Oro: Separación de Capas

- **`store/usePortfolioStore.ts`**: SOLO UI state (loading, error, caché local)
- **`lib/services/portfolio.service.ts`**: FUENTE DE VERDAD de datos financieros
- **Componentes nunca llaman a APIs directamente**: SIEMPRE través de `services/`

---

## ✅ Checklist de Auditoría - Pre-Merge

Antes de cualquier commit que toque financieras/autenticación:

- [ ] Sin `split(" ")[0]` en nombres de usuario
- [ ] Sin referencias a `cbu` o `CBU` en tipos/formularios
- [ ] Sin monedas extranjeras visibles en tabla de CEDEARs
- [ ] Portfolio context inyectado en chat si incluye cartera
- [ ] Export CSV funcional si toca movimientos
- [ ] `dynamic = 'force-dynamic'` en rutas que usan `getCurrentUser()`
- [ ] Validaciones de perfil SOLO requieren `phone`
- [ ] No hay comentarios obsoletos/dead code

---

## 🎯 Principios de Arquitectura - Inmutabilidad y Performance

1. **Dato ≠ Mutación**: Assets array es reemplazado, nunca modificado in-place
2. **Contexto ≠ Duplicación**: Portfolio se recupera UNA VEZ per request en chat
3. **Divisas ≠ Mezcla**: ARS y USD en canales separados, nunca co-renderizados
4. **Nombres ≠ Truncamiento**: Integridad textual preservada 100%

---

## 📞 Contacto y Preguntas

Para dudas sobre estas directrices, consultar el documento raíz: `claude.md`

---

**Última actualización**: 2 de Mayo, 2026  
**Versión**: 1.0 - Compliance Total  
**Estado**: Activo y Vinculante
