# ADR 0001 — Tipado con JSDoc + tsconfig, sin paso de build

**Fecha:** 2026-07-17 · **Estado:** Aceptada

## Contexto

EDS sirve los ficheros del repo directamente al navegador (ES modules + importmap), sin bundler. El código propio del boilerplate no tenía ningún tipado; los dropins publican `.d.ts` que no se aprovechaban. Un paso de build (TypeScript transpilado) daría mejor DX pero rompería la filosofía no-build de EDS, complicaría aem.live/live-reload y los updates del boilerplate.

## Decisión

JavaScript con anotaciones JSDoc + `tsconfig.json` con `allowJs`/`checkJs`/`noEmit`. El type-check (`npm run typecheck`) corre en editor y CI, nunca en runtime. El mapeo `paths` de `@dropins/*` resuelve contra los `.d.ts` reales de `scripts/__dropins__/`. El chequeo aplica inicialmente a las capas nuevas (`scripts/core|domain|dropins|ui`); se ampliará a `blocks/` a medida que se migren.

## Consecuencias

Lo que está en el repo es exactamente lo que ejecuta el navegador (debugging y PSI sin sorpresas). Seguridad de tipos real en el código de plataforma. `strict` se endurecerá por carpetas empezando por `core/`.
