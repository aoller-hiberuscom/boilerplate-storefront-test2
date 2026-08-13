# ADR 0003 — Arquitectura de capas con dependencias unidireccionales

**Fecha:** 2026-07-17 · **Estado:** Aceptada

## Contexto

El boilerplate concentraba 12 dominios en `scripts/commerce.js` (863 líneas), con dependencia circular `commerce.js ↔ initializers/index.js`, initializers que arrancaban por side-effect de importación y duplicación masiva entre blocks. Ver diagnóstico completo en `docs/ARQUITECTURA-FRONTEND.md`.

## Decisión

Capas con importaciones solo hacia abajo, ejecutadas por ESLint (`import/no-restricted-paths` + `import/no-cycle`):

```
blocks → ui → dropins → domain → core → vendor (aem.js, __dropins__, npm)
```

- `scripts/core/` — plataforma propia: config, graphql, events (catálogo), routes, storage (catálogo de claves), i18n, auth, consent, content, error, lifecycle, decoration, logger. Sin side effects de import.
- `scripts/domain/` — lógica de negocio: analytics (ACDL), product, seo.
- `scripts/dropins/` — integración declarativa de dropins: factory `createDropinInitializer` + `registry.js` (capacidades global/byPageType/bajo demanda vía `ensureCapability`). Puede usar `domain`.
- `scripts/ui/` — compartidos de UI: guards, slots (image, swatch, product-link, privacy-consent), layout (`data-ref`), modal, `mountDropinBlock`.
- `blocks/` — adaptadores finos sobre containers de dropins; declaran capacidades con `ensureCapability`/`mountDropinBlock`.
- La comunicación hacia arriba es solo por eventos (`core/events.js`).

## Consecuencias

`scripts/commerce.js` y `scripts/initializers/*` quedan como fachada/shims deprecados hasta migrar todos los blocks. El ciclo del core está roto; los initializers son funciones invocadas por el registro, no side-effects; el estado persistente y los eventos tienen catálogo único.
