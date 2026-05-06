# Flujo de importación y edición de cartera

## Objetivo
Hacer que la carga de CSV, Excel y Google Sheets sea más cómoda para el usuario, reduciendo ambigüedades entre CEDEARs, acciones locales, bonos y ETFs sin romper el flujo actual de cartera.

## Problemas que resuelve
- Importaciones con formatos distintos entre brokers.
- Ambigüedad entre CEDEAR y acción local para un mismo ticker.
- El botón de editar estaba llevando al detalle del activo en lugar de abrir un panel de edición de la posición.

## Flujo propuesto
1. El usuario sube un archivo o conecta Google Sheets.
2. La web detecta filas válidas y muestra una previsualización.
3. Cada fila queda clasificada por defecto con una categoría inicial.
4. Si una fila es ambigua, el usuario puede corregir su categoría antes de importar.
5. La importación guarda la posición, no solo el ticker.
6. En la cartera, el menú de acciones abre un panel de edición de la posición.

## Reglas de UX
- El usuario no debe adivinar si un activo es CEDEAR o acción local.
- La edición debe enfocarse en la posición del usuario, no en el detalle de mercado.
- La categoría inicial no debe arrancar en OTRO; por defecto se prefiere CEDEAR.
- Si el activo está en una fila local evidente, la interfaz puede corregirlo manualmente.

## Comportamiento del panel de edición
- Permite modificar cantidad.
- Permite modificar precio promedio.
- Permite corregir categoría del activo: CEDEAR, ACCION, BONO o ETF.
- No navega al detalle del activo cuando se abre desde el menú de cartera.

## Criterio para categorías
- CEDEAR: activo internacional operado en pesos en el mercado local.
- ACCION: acción local de BCBA.
- BONO: bono soberano o corporativo.
- ETF: fondo cotizado.

## Criterio de clasificación inicial
- Si el archivo ya trae una categoría explícita, se respeta.
- Si no hay categoría clara, se prefiere CEDEAR como valor inicial.
- El usuario puede corregir manualmente antes de confirmar.

## Resultado esperado
- Menos errores al importar.
- Menos fricción al editar cartera.
- Menos confusión entre instrumento de mercado y posición del usuario.
- Flujo consistente sin alterar la navegación principal de la app.
