# Regla: Diseño de interfaces y sistemas

## Cuándo aplicar
Cuando la tarea involucre cualquiera de lo siguiente:
- Diseñar o construir una app (web, móvil, desktop)
- Crear o mejorar una interfaz de usuario (UI)
- Hacer un sitio web o landing page
- Diseñar un sistema con componentes visuales
- Revisar o mejorar código de frontend (CSS, animaciones, componentes)
- Cualquier cosa donde el resultado final lo va a ver un usuario

## Qué hacer automáticamente
**Aplicar la filosofía de la skill `emil-design-eng` sin que Fabián lo pida.**

Esto incluye:
- Evaluar si cada elemento debe animarse o no (frecuencia de uso)
- Usar `ease-out` por defecto en entradas, nunca `ease-in`
- Duraciones bajo 300ms para UI interactiva
- `scale(0.95) + opacity` en entradas, nunca `scale(0)`
- `transform: scale(0.97)` en `:active` para botones
- Solo animar `transform` y `opacity` (no `height`, `width`, `padding`)
- Aplicar `@media (hover: hover) and (pointer: fine)` en hover animations
- `prefers-reduced-motion` para accesibilidad

## Formato de revisión de código UI
Cuando revises código de interfaz, usa SIEMPRE la tabla Before/After/Why de la skill:

| Before | After | Why |
| --- | --- | --- |
| problema encontrado | fix concreto | razón |

Nunca usar lista con "Before:" y "After:" en líneas separadas.

## Criterio general
En software, el gusto es el diferenciador. Cuando todos tienen algo funcional, los detalles invisibles son lo que hace que algo se sienta bien. Aplicar ese criterio por defecto, no solo cuando Fabián lo pida explícitamente.
