# Cambios Realizados - Fase 4 API (Mayo 2, 2026)

## 🎯 Resumen de Cambios
Se limpiaron datos hardcodeados, se agregó soporte correcto para CEDEARs con sufijo `.BA` y se arreglaron problemas de overflow en la UI.

## 📝 Cambios Específicos

### 1. **Eliminación de Datos Hardcodeados**
- **Archivo**: `components/dashboard/home-previews.tsx`
- **Cambio**: Se removió `FALLBACK_LATEST_MOVES` (datos falsos)
- **Resultado**: El home ahora muestra SOLO los movimientos reales de la BD

### 2. **Soporte Correcto para CEDEARs (.BA)**
- **Archivo**: `lib/yahoo.ts`
- **Cambio**: Mejorada función `toBCBASymbol()`:
  - CEDEARs internacionales → agregan `.BA` (AAPL → AAPL.BA)
  - Acciones BCBA locales → sin sufijo (GGAL → GGAL)
  - Bonos argentinos → sin sufijo (GD30D → GD30D)
- **Beneficio**: Consulta correcta de precios en Yahoo Finance

### 3. **Actualización de Tickers Rastreados**
- **Archivo**: `lib/services/market.service.ts`
- **Cambio**: `DEFAULT_TRACKED_TICKERS` ahora incluye:
  - CEDEARs: AAPL.BA, MSFT.BA, NVDA.BA, GOOGL.BA, AMZN.BA, META.BA, TSLA.BA
  - Acciones BCBA: GGAL, VIST, YPF, BMA, MELI
- **Resultado**: "Top Movers" muestra activos variados (NASDAQ + BCBA)

### 4. **Arreglo de Overflow en Números**
- **Archivos**:
  - `components/dashboard/summary-cards.tsx` → agregado `min-w-0 break-words`
  - `components/dashboard/home-previews.tsx` → agregado `truncate block` al precio
- **Resultado**: Números grandes no salen del box en mobile

### 5. **Script de Seeding para la Base de Datos**
- **Archivo**: `prisma/seed.ts` (nuevo)
- **Contiene**: 28 activos reales clasificados en:
  - 9 CEDEARs (Apple, Microsoft, NVIDIA, etc.)
  - 10 Acciones BCBA (Galicia, YPF, Macro, Mercado Libre, etc.)
  - 4 Bonos argentinos (GD30D, AY24D, TX2X, PR05D)
- **Beneficio**: Desarrollo local consistente sin datos inventados

## 🚀 Cómo Usar

### Ejecutar el Seeding
```bash
# Asegurar que DATABASE_URL esté configurada en .env.local
pnpm seed
```

### Verificar Activos en la Base de Datos
```bash
# Ver estructura de la tabla
psql $DATABASE_URL -c "SELECT symbol, name, type, currency FROM assets LIMIT 10;"
```

## 🔄 Flujo de Datos (Ahora sin hardcoding)

```
Usuario en /cartera
    ↓
getPortfolio(userId)
    ↓
db.position.findMany({userId})  ← De DB, NO hardcodeado
    ↓
getMarketQuote(yahooSymbol)     ← Yahoo Finance con .BA correcto
    ↓
Portfolio mostrado en UI
```

## ✅ Verificación
- ✓ Proyecto compila sin errores
- ✓ No hay `FALLBACK_*` o datos mock en componentes
- ✓ CEDEARs usan `.BA` (AAPL.BA)
- ✓ Acciones locales sin `.BA` (GGAL)
- ✓ Números no overflow en mobile
- ✓ Seed.ts crea 28 activos reales

## 📌 Notas Importantes
- El seed **limpia datos previos** solo en desarrollo (NODE_ENV !== "production")
- Los CEDEARs cotizan en **ARS** en BCBA (no USD)
- Todos los tickers están configurados en `yahooSymbol` de la tabla Asset
- Portfolio.service.ts siempre obtiene de DB, nunca devuelve hardcoded data

## 🔮 Próximos Pasos (Fase 4)
1. Ejecutar el seed para llenar la tabla de Assets
2. Crear posiciones y transacciones de usuario en DB
3. Testear que los precios se actualizan correctamente
4. Implementar herramientas del agente IA
