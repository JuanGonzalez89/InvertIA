# Fase 5: Pulido de cartera y UX visual

Esta fase documenta los cambios hechos sobre la vista de cartera para mejorar legibilidad, consistencia visual y precisión en la interpretación de datos reales.

## Objetivo

Refinar la experiencia del usuario en la sección `Mi cartera` para que los valores se vean claros, la tabla quede ordenada y los datos reflejen correctamente la cartera real del usuario.

## Cambios realizados

- La tabla de `Mi cartera` ahora muestra `Tipo` junto con `Ticker`, `Nominales`, `Precio`, `V. Actual`, `V. Inicial` y `Rendimiento`.
- Los valores monetarios se muestran sin decimales para evitar ruido visual en ARS.
- Los cálculos de cartera y rendimiento quedaron normalizados en ARS para no mezclar monedas en pantalla.
- La distribución por tipo se movió a un layout más amplio para darle más aire a la tabla principal.
- El bloque de distribución baja de prioridad en pantallas medianas para no comprimir la cartera.
- El menú de acciones mantiene la edición de posición como panel independiente.
- Se corrigió el flujo de `Editar posición` para que abra el diálogo correctamente desde el menú contextual.
- Se actualizó el texto global del footer para reflejar que la app trabaja con datos reales y actualizados.

## Resultado esperado

- Una tabla más clara y uniforme.
- Menos errores de lectura en importes y rendimientos.
- Mejor separación entre datos de cartera y distribución.
- Una UX más limpia al editar posiciones.

## Observaciones técnicas

- El render de los importes usa formateo sin decimales.
- La lógica de cálculo se mantiene separada de la presentación.
- La tabla prioriza la legibilidad antes que condensar demasiada información en un espacio reducido.