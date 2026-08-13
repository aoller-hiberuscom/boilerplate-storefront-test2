# ADR 0002 — Compatibilidad razonable con el upstream de Adobe

**Fecha:** 2026-07-17 · **Estado:** Aceptada

## Contexto

El proyecto parte de `hlxsites/aem-boilerplate-commerce` v9. Adobe publica actualizaciones de dropins (npm) y del boilerplate. Divergir totalmente nos dejaría sin correcciones; congelarnos nos impediría personalizar.

## Decisión

No se toca `scripts/aem.js` (protegido por CI) ni `scripts/__dropins__/` (generado por postinstall). Los dropins se actualizan por npm (workflow semanal + Renovate) y se extienden solo por sus vías oficiales: configuración de initialize, slots, tokens CSS y `build.mjs` (overrideGQLOperations). Todo el código propio nuevo vive en carpetas que el boilerplate no tiene (`scripts/core|domain|dropins|ui`, `docs/`), y `scripts/commerce.js` queda como fachada deprecada de re-exports mientras dure la migración de blocks. Las actualizaciones del boilerplate en sí se revisan manualmente.

## Consecuencias

Los updates de dropins fluyen sin fricción. El coste es mantener la fachada y los shims de `scripts/initializers/` hasta completar la fase 3 (migración de blocks), momento en el que se eliminarán.
