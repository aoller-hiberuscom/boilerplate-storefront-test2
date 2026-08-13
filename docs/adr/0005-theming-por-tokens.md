# ADR 0005 — Theming de Sports Emotion por design tokens (sin frameworks CSS)

**Fecha:** 2026-07-17 · **Estado:** Aceptada (marca Fútbol Emotion aplicada desde
`docs/DESIGN-SYSTEM-FIGMA.md`)

## Contexto

Hay que aplicar la identidad visual de Sports Emotion sobre el design system del boilerplate. Se evaluó introducir TailwindCSS: se descartó porque (a) Adobe lo desaconseja explícitamente en sus buenas prácticas ("Less, Sass, PostCSS, Tailwind and friends" — la solución más simple es CSS estándar del navegador; mantener el proyecto sin build), (b) la mayoría del DOM lo generan el backend EDS y los dropins (Preact), donde no se pueden inyectar clases utility, y (c) el mecanismo soportado para re-tematizar los dropins son las CSS custom properties bajo `:root, .dropin-design`.

## Decisión

El theming vive en un ÚNICO bloque delimitado al final de `styles/styles.css` ("SPORTS EMOTION — THEME OVERRIDES") que sobreescribe por cascada los tokens base. Se eligió bloque-en-fichero en lugar de la carpeta `styles/tokens/` planteada inicialmente en el documento de arquitectura para no añadir peticiones render-blocking adicionales (EDS carga `styles.css` como CSS crítico único).

Reglas: los blocks y secciones consumen exclusivamente tokens (`var(--…)`), nunca valores literales de marca; el CSS below-the-fold de marca va a `lazy-styles.css`; la tipografía corporativa se introducirá vía `fonts.css` + override de `--type-base-font-family` en el bloque de theme.

Los valores actuales NO son provisionales: el bloque "SPORTS EMOTION — THEME OVERRIDES" de
`styles/styles.css` implementa la **marca Fútbol Emotion** extraída del sistema de diseño de Figma
(validado en PDP — ver `docs/DESIGN-SYSTEM-FIGMA.md`). Incluye la rampa Slate dominante (`#18191a`
unifica los negros duplicados), el acento de marca (`#ff8c00 → #ffd157`, gradiente del CTA), la
semántica de la web actual (`#f53f3f`, `#0e8756`, `#fff700`) y la escala tipográfica completa con
las fuentes corporativas servidas desde `futbolemotion.com` (BeTheBest) + Inter + Manrope. Los
huecos sin decisión de marca (warning/info semánticos, separar el rojo de error del de descuento,
comportamiento >1440px) quedan marcados como `PENDIENTE` en el propio bloque.

## Consecuencias

Un único punto re-tematiza tienda y dropins a la vez, sin build, sin riesgo de rendimiento y sin fricción con las actualizaciones del design system de dropins. La deuda pendiente es de contenido (valores de marca), no de infraestructura.
