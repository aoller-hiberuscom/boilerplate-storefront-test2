# Arquitectura Frontend — Sports Emotion Storefront

| | |
|---|---|
| **Proyecto** | sports-emotion-storefront (Adobe Commerce Storefront / Edge Delivery Services) |
| **Base** | `hlxsites/aem-boilerplate-commerce` v9.0.0 (snapshot íntegro, sin personalización aún) |
| **Fecha** | 2026-07-17 |
| **Estado** | Propuesta — pendiente de validación por el equipo |
| **Decisiones marco** | JS + JSDoc tipado (sin build step) · Compatibilidad razonable con upstream · Refactor solo de código propio |

---

## 1. Resumen ejecutivo

El repositorio es un snapshot limpio del boilerplate oficial de Adobe. Como plataforma es sólida: Edge Delivery Services (EDS) garantiza rendimiento de carga excepcional, y los dropins (`@dropins/*`) aportan componentes de commerce completos, tematizables por tokens y extensibles por slots y GraphQL. Ese sustrato hay que conservarlo.

Sin embargo, el código *propio* del boilerplate (blocks y `scripts/`) es código de demostración, no arquitectura de producto. El diagnóstico detallado (sección 3) confirma la percepción del equipo: un god-module de 863 líneas (`scripts/commerce.js`) que mezcla 12 dominios distintos, dependencias circulares en el core, initializers que arrancan por side-effect de importación, estado global mutable sin encapsular, duplicación masiva entre blocks (el mismo código copiado hasta en 16 ficheros), un checkout de 1.300 líneas con ciclo de vida casero, dos implementaciones paralelas de login en el header, código demo residual (producto `MH05` de Hollister hardcodeado), textos en inglés sin i18n, un stub de consentimiento que devuelve siempre `true` (riesgo RGPD) y una CI cuyos tests están desactivados fuera del repo de Adobe.

La propuesta (secciones 4–6) no consiste en reescribir la plataforma sino en construir, sobre ella, una **arquitectura de capas propia** con dependencias unidireccionales: un *core* de plataforma tipado (config, eventos, storage, rutas, i18n, GraphQL, consent), una capa de *integración de dropins* declarativa que elimina el boilerplate repetido, una capa de *UI compartida* (slots, guards, layouts) y blocks que quedan reducidos a adaptadores finos. Todo en JavaScript con JSDoc + `tsconfig` (`checkJs`), sin romper la filosofía no-build de EDS ni el contrato con `aem.js` y los dropins, y por tanto sin renunciar a las actualizaciones de Adobe vía npm.

El plan de migración (sección 6) se estructura en seis fases incrementales, empezando por higiene y correcciones de bugs (coste bajo, valor inmediato) y terminando en el theming de Sports Emotion, de forma que el equipo pueda empezar a personalizar sobre base sólida desde la fase 2 sin esperar al final del refactor.

---

## 2. Contexto y restricciones de la plataforma

Antes de proponer nada hay que dejar claro qué es innegociable en este stack, porque delimita el espacio de diseño de cualquier refactorización.

**EDS impone un modelo de ejecución concreto.** El HTML lo genera el backend de aem.live a partir del contenido autorado; el frontend lo *decora* en cliente. La carga es trifásica (eager → lazy → delayed) y está orquestada por `scripts/aem.js` + `scripts/scripts.js`. El rendimiento (objetivo Lighthouse 100) depende de respetar ese modelo: mínimo JS en fase eager, CSS crítico en `styles.css`, code-splitting natural por carpeta de block.

**`scripts/aem.js` es intocable.** Es el core de Adobe; existe incluso un workflow de CI (`protect-aem-js.yaml`) que falla si difiere del upstream. Toda nuestra arquitectura debe construirse *alrededor* de él, nunca modificándolo.

**`scripts/__dropins__/` es código generado.** Lo regenera `postinstall.js` en cada `npm install` copiando el `dist` de los paquetes `@dropins/*`. No se edita jamás a mano. Los mecanismos oficiales de extensión de dropins son cuatro: configuración en el `initialize` de cada dropin, **slots** (inyección de UI en puntos definidos de cada container), **tokens CSS** (`:root, .dropin-design`) y **`build.mjs`** (`overrideGQLOperations`, para extender/recortar las queries GraphQL que ejecutan los dropins). Cualquier personalización profunda debe canalizarse por esas cuatro vías.

**El contrato de blocks es fijo.** Cada block es una carpeta `blocks/<nombre>/` con `<nombre>.js` (export default `decorate(block)`) y `<nombre>.css`, cargados on-demand por `loadBlock()`. La estructura inicial del DOM del block es el contrato con el autor de contenido: romperla rompe páginas ya publicadas. El refactor puede cambiar libremente el *interior* de los blocks, no su contrato externo.

**Sin bundler.** Los ficheros se sirven tal cual al navegador (ES modules + importmap en `head.html`). La decisión adoptada (JS + JSDoc) respeta esto: el type-checking ocurre en editor y en CI, no en un paso de build.

**Decisión de compatibilidad upstream.** No tocamos `aem.js` ni `__dropins__`, mantenemos las convenciones que espera el tooling de Adobe (estructura de blocks, `models/`, `build.mjs`, `postinstall.js`) y concentramos el refactor en `scripts/` propio y `blocks/`. Las actualizaciones de dropins siguen fluyendo por npm (workflow semanal + Renovate); las del boilerplate en sí se revisarán manualmente y serán cada vez menos relevantes a medida que nuestro código propio lo sustituya.

---

## 3. Diagnóstico del estado actual

### 3.1 Inventario

El proyecto contiene 44 blocks (10 de contenido EDS puro, 34 de commerce), un runtime propio en `scripts/` (~1.700 líneas propias sin contar `aem.js` ni código generado), 12 initializers de dropins, un sistema completo de design tokens de Adobe en `styles/styles.css`, una suite Cypress de 26 specs y 8 workflows de GitHub Actions. Git confirma que es el boilerplate intacto: un único commit inicial, cero referencias a Sports Emotion o Hiberus en el código, `package.json` todavía identificado como `@adobe/aem-boilerplate-commerce`.

### 3.2 Hallazgos arquitectónicos

**A1 — God-module: `scripts/commerce.js` (863 líneas, 12 dominios).** Un solo fichero concentra: los singletons GraphQL (`CORE_FETCH_GRAPHQL`, `CS_FETCH_GRAPHQL`), flags de entorno (`IS_UE`, `IS_DA`), ~20 constantes de rutas, gestión de configuración (`getConfigFromSession`, `fetchPlaceholders`, `fetchIndex`), orquestación de ciclo de vida (`initializeCommerce`, `loadCommerceEager/Lazy`), detección de tipo de página, Adobe Data Layer y tracking de historial, helpers de URL multi-store (`decorateLinks`, `rootLink`, `getProductLink`), helpers de producto (`getProductSku`, `isProductTemplate`), decoración DOM (`decorateSections` — que además **duplica** la función homónima de `aem.js`), JSON-LD, auth (`checkIsAuthenticated`), consent, modales y páginas de error. Es el punto de acoplamiento de todo el proyecto: 30+ ficheros importan de él.

**A2 — Dependencia circular en el corazón del core.** `scripts/commerce.js:15` importa `initializers/index.js`, y `scripts/initializers/index.js:7` importa `CORE_FETCH_GRAPHQL`, `CS_FETCH_GRAPHQL` y `fetchPlaceholders` de `commerce.js`. El ciclo funciona por casualidad del orden de evaluación de ES modules, pero hace el grafo frágil e imposible de testear por unidades. `scripts.js` tiene otro ciclo reconocido con `blocks/fragment/fragment.js` (eslint-disable explícito).

**A3 — Initializers por side-effect de importación.** Los 12 ficheros de `scripts/initializers/` terminan en `await initializeDropin(async () => {...})();` a nivel de módulo (top-level await). Importar el módulo *es* arrancar el dropin. Consecuencias: el orden de imports es semánticamente significativo, no hay forma de testear un initializer sin ejecutarlo, y el "routing" real de qué se inicializa en cada página es implícito — depende de qué blocks haya puesto el autor en la página, salvo el caso especial de PDP que se autodetecta por selector CSS (`detectPageType()` en `commerce.js:154`). No existe tabla central página→capacidades.

**A4 — Estado global mutable y sin encapsular.** Los singletons GraphQL son mutados desde al menos tres ficheros distintos (endpoints, headers de auth, customer group, price book). Caches en `window.index`, `window.placeholders` (con semáforo `_pending`), `window.adobeDataLayer`. Claves mágicas de cookies/storage repartidas como literales por todo el código: `auth_dropin_user_token`, `dropin_website_path`, `DROPINS_CART_ID`, `selectedShippingAddress_addressData`, etc. No hay un solo módulo que declare "este es el estado persistente del proyecto".

**A5 — Dos buses de eventos desconectados y sin catálogo.** Coexisten el event-bus de dropins (`events.on/emit`: `cart/data`, `pdp/valid`, `checkout/updated`, `authenticated`…) y el Adobe Client Data Layer (`window.adobeDataLayer`: `pageContext`, `productContext`, `place-order`…). Los nombres de evento son strings literales dispersos, sin constantes ni tipos propios. `trackHistory()` mezcla ambos mundos dentro de `commerce.js`.

**A6 — Duplicación masiva entre blocks.** Cuantificada: el patrón `fetchPlaceholders` + `langDefinitions` + `mountImmediately` está copiado casi idéntico en los 10 initializers de dropins; el guard de autenticación (`checkIsAuthenticated()` + redirect a login) se repite en 16 ficheros; `swatchImageSlot` es idéntico byte a byte en 4 ficheros; `createProductLink` está definido localmente en 6 blocks con dos firmas distintas; el boilerplate de slot de imagen con `tryRenderAemAssetsImage` aparece ~40 veces en 16 ficheros; la lógica "tras login, recargar o redirigir" está triplicada; el manejo del mini-PDP de edición está duplicado entre `commerce-cart` y `commerce-mini-cart`.

**A7 — El checkout es el punto más caliente.** `blocks/commerce-checkout/` (1.321 líneas en 5 ficheros) coordina 6 dropins y ~20 containers con: un registro de ciclo de vida casero (`registry = new Map()` en `containers.js`), triple fuente de verdad para el DOM (scaffold string, mapa de selectores y clases repetidas), un `Promise.all` con destructuring posicional de 14 elementos, dos funciones de direcciones customer (shipping/billing) idénticas al ~90%, estado repartido entre closures, refs, sessionStorage y eventos, y callbacks que anidan renders de 3 dropins (login → auth → modal; payment → credit card vía `replaceHTML` dentro de slot dentro de container). Extender el checkout —lo primero que pide cualquier cliente— exige hoy tocar 4 ficheros coordinadamente.

**A8 — `product-details` y `header` violan SRP de forma severa.** `product-details.js` (565 líneas) mezcla layout, 11 renders de containers (con la config de galería duplicada mobile/desktop), lógica de add-to-cart con imports dinámicos repetidos, SEO/JSON-LD con una query GraphQL embebida, meta tags imperativos y 6 listeners de eventos con estado en closures. `header.js` (543 líneas + 3 auxiliares) mezcla decoración de nav, accesibilidad de teclado, tres paneles imperativos y una máquina de estados casera basada en atributos `data-*`; sus auxiliares contienen DOM-scraping por texto (`li.textContent.includes('Account')`), detección del botón "undo" leyendo `innerHTML`, y **dos implementaciones paralelas de UI de login** (`renderAuthCombine` y `renderAuthDropdown`).

### 3.3 Bugs y deuda concreta verificada

| # | Fichero | Problema | Impacto |
|---|---|---|---|
| B1 | `scripts/initializers/pdp.js:127` | `if (isAemAssetsEnabled)` — falta invocar la función; la referencia es siempre truthy | La rama AEM Assets se ejecuta siempre, esté o no habilitado |
| B2 | `scripts/commerce.js:812` | `getConsent()` es un stub que devuelve siempre `true` | Analítica y tracking corren sin consentimiento real — riesgo RGPD directo para un e-commerce europeo |
| B3 | `scripts/scripts.js:143` | `document.documentElement.lang = 'en'` hardcodeado | SEO/a11y incorrectos en un storefront es-ES / multi-store |
| B4 | `styles/styles.css:409-418` | Botones `.secondary`/`.accent` referencian tokens inexistentes (`--light-color`, `--dark-color`, `--link-color`) | Estados de botón con valores inválidos |
| B5 | `blocks/header/renderAuthCombine.js:274` | Producto demo hardcodeado (`hollister-backyard-sweatshirt`, `MH05`) | Código demo en producción |
| B6 | `scripts/commerce.js:328` y `payment-services.js:17` | `await` sobre `getConfigValue()` que es síncrona | Engañoso; oculta el modelo real de config |
| B7 | Múltiples | Textos UI hardcodeados en inglés fuera del sistema de placeholders (`authPrivacyPolicyConsentSlot`, checkout-success, mini-PDP, seller-assisted banner) | i18n rota para es-ES |
| B8 | `.github/workflows/run-e2e-tests*.yaml`, `run-percy-*.yaml` | Gateados a `github.repository == 'hlxsites/aem-boilerplate-commerce'` | **Cero tests en la CI de este repo**; el único gate real es lint |
| B9 | Repo | Rama local `master` vs remoto `origin/main`; `cleanup-on-create.yaml` nunca ejecutado (persisten placeholders `{ORG}/{REPO}`, `.renovaterc.json`, identidad Adobe en `package.json`) | Confusión operativa; URLs aem.live asumen `main` |
| B10 | `demo-config.json`, `demo-config-aco.json` | API keys demo de Adobe y endpoints `aemshop.net` | Sustituir por la configuración real del proyecto |

### 3.4 Tooling y calidad

Lo que existe y funciona: ESLint (airbnb) + Stylelint activos en CI, hooks de pre-commit que fuerzan README por block y regeneran los modelos del Universal Editor, protección de `aem.js`, actualización automatizada de dependencias Adobe, y una guía `AGENTS.md` completa. Lo que falta: type-checking (cero tipos en código propio pese a que los dropins publican `.d.ts`), tests unitarios (no hay ningún runner), CI de tests efectiva (B8), presupuesto de rendimiento automatizado en el propio repo, y documentación de arquitectura del proyecto (este documento inaugura esa carpeta).

La suite Cypress es rica (26 specs: journey completo + validación de analítica) pero está acoplada al backend y catálogo demo de Adobe (SKUs `CYPRESS456`, `mcstaging.aemshop.net`): requiere adaptación al backend real antes de servir.

### 3.5 Veredicto

La intuición del equipo es correcta y ahora está cuantificada. La *plataforma* (EDS + dropins + tokens) es de primer nivel y no debe abandonarse. El *código de aplicación* es un ejemplo pedagógico sin arquitectura: no hay capas, no hay dirección de dependencias, no hay catálogo de eventos ni de estado, no hay tipos, no hay tests efectivos, y los tres blocks que más personalización van a recibir (checkout, PDP, header) son precisamente los peor estructurados. Construir Sports Emotion directamente encima significaría multiplicar estos patrones en cada block nuevo. La refactorización propuesta a continuación es, por tanto, una inversión previa necesaria y acotada.

---

## 4. Principios de la arquitectura objetivo

Seis principios rectores, ordenados por prioridad. Cada decisión posterior de este documento se justifica contra ellos.

**P1 — La plataforma es vendor; nuestro código es producto.** Frontera nítida entre lo que Adobe mantiene (`aem.js`, `__dropins__/`, dropins vía npm) y lo que nosotros mantenemos. El código propio nunca reimplementa lo que la plataforma ya da (ciclo de vida de containers, theming, fetching de dropins) y la plataforma nunca se parchea (se extiende por sus cuatro vías oficiales).

**P2 — Dependencias unidireccionales.** Las capas solo importan hacia abajo: `blocks → ui → domain/dropins → core → vendor`. Cero ciclos (regla `import/no-cycle` en error, hoy desactivada). La comunicación hacia arriba es exclusivamente por eventos.

**P3 — Todo efecto es explícito.** Ningún módulo ejecuta lógica de arranque por el mero hecho de ser importado. Los módulos exportan funciones; alguien con nombre y apellidos las invoca. El estado persistente (cookies, storage, caches) se declara en un único sitio.

**P4 — Un concepto, un módulo, un sitio.** Cada dominio (config, eventos, rutas, i18n, auth, consent…) tiene exactamente un módulo dueño. Si un patrón aparece dos veces en blocks, se promociona a la capa compartida (regla de dos, no de tres: este boilerplate demuestra lo rápido que se copia).

**P5 — Tipado sin build.** JSDoc + `tsconfig` con `checkJs` sobre todo el código propio, aprovechando los `.d.ts` que ya publican los dropins. El type-check corre en editor y CI. Cero transpilación: lo que está en el repo es lo que ejecuta el navegador (principio EDS).

**P6 — El rendimiento es un presupuesto, no una esperanza.** El refactor no puede degradar el modelo eager/lazy/delayed. Cada fase de migración termina con una medición Lighthouse contra preview y el objetivo sigue siendo 100.

---

## 5. Arquitectura objetivo

### 5.1 Modelo de capas

```
┌────────────────────────────────────────────────────────────┐
│  blocks/                    Adaptadores finos (decorate)    │  ← contrato con autores
├────────────────────────────────────────────────────────────┤
│  scripts/ui/                UI compartida: slots, guards,   │
│                             layouts, modal, notificaciones  │
├──────────────────────────┬─────────────────────────────────┤
│  scripts/domain/          │  scripts/dropins/               │
│  Lógica de negocio propia │  Integración declarativa con    │
│  (SEO, analytics, product │  los dropins (factory +         │
│  helpers, checkout flow)  │  registro por capacidades)      │
├──────────────────────────┴─────────────────────────────────┤
│  scripts/core/             Plataforma propia: config,       │
│                             events, routes, storage, i18n,  │
│                             graphql, consent, logger, env   │
├────────────────────────────────────────────────────────────┤
│  VENDOR (no se toca):  scripts/aem.js · scripts/__dropins__ │
│  @dropins/* (npm) · ACDL · events-sdk/collector             │
└────────────────────────────────────────────────────────────┘
```

Reglas de importación (se harán cumplir con `eslint-plugin-import` + `import/no-restricted-paths`):

| Capa | Puede importar de | No puede importar de |
|---|---|---|
| `blocks/` | `ui`, `domain`, `dropins`, `core`, vendor | otros blocks (salvo `fragment`/`modal` vía `ui`) |
| `scripts/ui/` | `dropins`, `domain`, `core`, vendor | `blocks` |
| `scripts/dropins/` | `domain`, `core`, vendor | `ui`, `blocks` |
| `scripts/domain/` | `core`, vendor | `dropins`, `ui`, `blocks` |
| `scripts/core/` | vendor | todo lo demás |

### 5.2 Estructura de directorios propuesta

```
storefront/
├── blocks/                          # Igual que hoy (contrato EDS), pero cada block es fino
│   └── commerce-checkout/
│       ├── commerce-checkout.js     # decorate(): compone layout + monta secciones
│       ├── commerce-checkout.css
│       ├── sections/                # (solo blocks complejos) una sección = un módulo
│       │   ├── login.js
│       │   ├── shipping.js
│       │   ├── billing.js
│       │   ├── payment.js
│       │   └── order-summary.js
│       └── README.md
├── scripts/
│   ├── aem.js                       # VENDOR — intocable
│   ├── __dropins__/                 # VENDOR — generado por postinstall
│   ├── scripts.js                   # Orquestador EDS (adelgazado; delega en core/lifecycle)
│   ├── delayed.js
│   ├── core/
│   │   ├── config.js                # Fachada tipada de config.json + placeholders + entorno
│   │   ├── env.js                   # IS_UE, IS_DA, detección de entorno — sin side effects
│   │   ├── events.js                # Catálogo tipado de eventos + wrapper on/emit
│   │   ├── routes.js                # Constantes de rutas + builders (rootLink, productUrl…)
│   │   ├── storage.js               # TODAS las keys de cookie/session/local + accesores
│   │   ├── graphql.js               # Clients CORE/CS + gestión de headers en un solo sitio
│   │   ├── i18n.js                  # fetchPlaceholders, labels tipados, locale real
│   │   ├── consent.js               # Implementación real de consentimiento (CMP)
│   │   ├── auth.js                  # isAuthenticated, token, headers de auth
│   │   ├── lifecycle.js             # initializeCommerce/loadEager-hooks (sin ciclo)
│   │   └── logger.js                # log con niveles, silenciable en producción
│   ├── dropins/
│   │   ├── registry.js              # Tabla declarativa capacidad → initializer → páginas
│   │   ├── create-initializer.js    # Factory que elimina el boilerplate x10
│   │   └── initializers/            # Uno por dropin, ahora de ~15 líneas declarativas
│   │       ├── auth.js  cart.js  checkout.js  pdp.js  ...
│   ├── domain/
│   │   ├── product.js               # sku desde URL/metadata, product links, atributos
│   │   ├── seo.js                   # JSON-LD, meta tags (sale de product-details)
│   │   ├── analytics.js             # ACDL: contexts, page-view, trackHistory
│   │   └── checkout-flow.js         # Máquina de estados del checkout (guest/customer…)
│   ├── ui/
│   │   ├── slots/
│   │   │   ├── image-slot.js        # El patrón tryRenderAemAssetsImage (hoy x40)
│   │   │   ├── swatch-slot.js       # swatchImageSlot (hoy x4)
│   │   │   └── product-link.js      # createProductLink unificado (hoy x6)
│   │   ├── guards.js                # requireAuth / requireGuest (hoy x16)
│   │   ├── layout.js                # createLayout(html) → refs tipadas (scaffold + selectors)
│   │   ├── modal.js                 # Servicio de modal (envuelve blocks/modal)
│   │   └── notifications.js         # InLineAlert / toasts consistentes
│   └── types/
│       ├── events.d.ts              # Payloads de nuestros eventos
│       └── project.d.ts             # Tipos de dominio (config, labels, rutas)
├── styles/
│   ├── styles.css                   # Crítico: reset + secciones + imports de tokens
│   ├── tokens/
│   │   ├── base.css                 # Tokens del design system de dropins (los actuales)
│   │   └── sports-emotion.css       # Overrides de marca (única fuente del theming)
│   ├── lazy-styles.css
│   └── fonts.css
├── docs/
│   ├── ARQUITECTURA-FRONTEND.md     # Este documento
│   └── adr/                         # Architecture Decision Records (una decisión = un md)
├── test/
│   ├── unit/                        # Vitest: core/, domain/, ui/ (jsdom)
│   └── ...
├── tsconfig.json                    # checkJs sobre blocks/ y scripts/ propio
└── (resto igual: models/, tools/, cypress/, build.mjs, postinstall.js)
```

Notas de compatibilidad upstream: `blocks/`, `models/`, `build.mjs`, `postinstall.js`, `head.html` y la convención de carga no cambian de sitio ni de contrato. `scripts/commerce.js` se mantiene temporalmente como **fachada de re-export deprecada** hacia `core/*` y `domain/*` durante la migración (sección 6), de modo que los blocks se migran de uno en uno sin big-bang.

### 5.3 La capa `core/` en detalle

**`core/config.js`** — hoy la configuración se lee con `getConfigValue('commerce-core-endpoint')` (string mágico, a veces con `await` innecesario) desde cualquier sitio. La fachada expone accesores tipados y documentados, y es el único módulo que conoce `sessionStorage` y `configs.js` de dropins:

```js
// core/config.js
/** @returns {string} Endpoint GraphQL de Commerce Core */
export const getCoreEndpoint = () =>
  getConfigValue('commerce-core-endpoint') || getConfigValue('commerce-endpoint');

export const getStoreConfig = () => ({
  storeViewCode: getConfigValue('headers.cs.Magento-Store-View-Code'),
  rootPath: getRootPath(),
  isMultistore: isMultistore(),
});
```

**`core/events.js`** — catálogo único de eventos con constantes y tipos. Elimina los strings dispersos y da autocompletado sobre los payloads (los dropins ya publican `events-catalog.d.ts`; lo extendemos con los nuestros):

```js
// core/events.js
export const EVENTS = Object.freeze({
  LCP: 'aem/lcp',
  AUTHENTICATED: 'authenticated',
  CART_DATA: 'cart/data',
  CHECKOUT_UPDATED: 'checkout/updated',
  PDP_VALID: 'pdp/valid',
  // ... catálogo completo, incluidos eventos propios 'se/*'
});

/**
 * @template {keyof EventPayloads} K
 * @param {K} event @param {(p: EventPayloads[K]) => void} handler
 */
export const on = (event, handler, opts) => events.on(event, handler, opts);
export const emit = (event, payload, opts) => events.emit(event, payload, opts);
export const lastPayload = (event) => events.lastPayload(event);
```

**`core/storage.js`** — todas las claves de cookies/session/local en un único módulo con accesores. Hoy `auth_dropin_user_token` aparece como literal en N sitios; mañana:

```js
export const KEYS = Object.freeze({
  AUTH_TOKEN: 'auth_dropin_user_token',
  WEBSITE_PATH: 'dropin_website_path',
  CART_ID: 'DROPINS_CART_ID',
  SHIPPING_ADDRESS: 'selectedShippingAddress_addressData',
  // ...
});
export const getAuthToken = () => getCookie(KEYS.AUTH_TOKEN);
```

**`core/graphql.js`** — es dueño de los dos clients (`core`, `catalogService`) y de TODA la mutación de headers (auth, customer group, price book, ACO). Los initializers piden el client, no lo mutan. Se acaba el singleton manoseado desde tres ficheros.

**`core/consent.js`** — sustituye el stub B2. Integra el CMP que se elija para Sports Emotion (OneTrust, Didomi, Cookiebot…) y expone `getConsent(topic)` real + evento `se/consent-changed`. Analítica (`delayed.js`, `domain/analytics.js`) se suscribe. Esto es un requisito legal, no una mejora.

**`core/lifecycle.js`** — rompe el ciclo A2. El flujo de arranque queda lineal y explícito: `scripts.js` → `lifecycle.initEager()` (config → graphql → dropins globales vía `dropins/registry.js`) → `lifecycle.initLazy()` → `delayed.js`. Ningún módulo de `core/` importa de `dropins/`ni viceversa en ambos sentidos.

### 5.4 La capa `dropins/`: integración declarativa

El boilerplate repite 10 veces el mismo ritual (placeholders → langDefinitions → `mountImmediately`) y esconde el arranque en side-effects de import. Se sustituye por una factory y un registro:

```js
// dropins/create-initializer.js
/**
 * @param {object} def
 * @param {string} def.name                p.ej. 'cart'
 * @param {object} def.api                 api del dropin (initialize, setEndpoint)
 * @param {'core'|'catalogService'} def.endpoint
 * @param {string} [def.placeholders]      p.ej. 'placeholders/cart.json'
 * @param {() => Promise<object>} [def.config]  config extra por dropin
 */
export function createDropinInitializer(def) {
  return initializeDropin(async () => {
    setEndpoint(def.endpoint, def.api);
    const labels = def.placeholders ? await fetchPlaceholders(def.placeholders) : {};
    const extra = def.config ? await def.config() : {};
    return initializers.mountImmediately(def.api.initialize, {
      langDefinitions: { default: { ...labels } },
      ...extra,
    });
  });
}
```

Cada initializer pasa de ~40 líneas imperativas a ~12 declarativas, y deja de auto-ejecutarse al importarse: exporta `init()` y es el **registro** quien decide cuándo montarlo:

```js
// dropins/registry.js — la tabla que hoy no existe
export const CAPABILITIES = {
  global: ['auth', 'personalization', 'cart'],          // todas las páginas (fase eager/lazy)
  byPageType: { Product: ['pdp'], Category: ['search'], Checkout: ['checkout', 'order', 'payment-services', 'account'] },
  byBlock: { 'commerce-wishlist': ['wishlist', 'cart'], /* ... */ },
};
```

Con esto el "¿qué se carga en esta página y por qué?" tiene una respuesta de un vistazo, los blocks dejan de importar initializers por side-effect (importan capacidades: `await ensureCapability('wishlist')`), y añadir un dropin nuevo es una entrada en una tabla. El routing especial de `order.js` (redirecciones según auth/token) se mueve a `domain/` como lógica de negocio testeable.

### 5.5 La capa `ui/`: matar la duplicación

Cuatro módulos eliminan de golpe las duplicaciones cuantificadas en A6. `ui/guards.js` reemplaza las 16 copias del auth-gate (`requireAuth(block, render)` redirige a `ROUTES.LOGIN` o ejecuta el render). `ui/slots/image-slot.js` y `swatch-slot.js` encapsulan las ~40+4 copias del boilerplate de imágenes con AEM Assets. `ui/slots/product-link.js` unifica las 6 firmas de `createProductLink`. Y `ui/layout.js` sistematiza el patrón scaffold que hoy cada block reimplementa a mano:

```js
// ui/layout.js
/**
 * Crea un fragmento desde template y devuelve refs a los nodos marcados con data-ref.
 * @param {string} html
 * @returns {{ root: DocumentFragment, refs: Record<string, HTMLElement> }}
 */
export function createLayout(html) {
  const root = document.createRange().createContextualFragment(html);
  const refs = Object.fromEntries(
    [...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]),
  );
  return { root, refs };
}
```

Esto sustituye la "triple fuente de verdad" del checkout (scaffold + mapa de selectores + querySelectors) por una sola: el template con `data-ref`.

### 5.6 Refactor de los tres blocks críticos

**Checkout.** Se descompone `containers.js` (803 líneas) en `sections/` — un módulo por sección funcional (login, shipping, billing, payment, order-summary), cada uno con la firma común `mount(refs, ctx)` / `unmount()`. La dualidad guest/customer y la simetría shipping/billing (hoy dos funciones 90% idénticas) se unifican parametrizando por `addressType` y por estrategia de usuario, gobernadas por una máquina de estados explícita en `domain/checkout-flow.js` que reacciona al catálogo de eventos (`cart/initialized`, `authenticated`, `checkout/values`) y es testeable en unidad sin DOM. El registry casero desaparece: el ciclo de vida lo dan las secciones. El destructuring posicional de 14 elementos desaparece: cada sección monta lo suyo.

**Product details.** Se parte en cuatro: el block queda con layout + composición de containers; `domain/seo.js` absorbe JSON-LD y meta tags (con su query GraphQL en `core/graphql.js` como operación nombrada); la lógica add-to-cart/update se extrae a un módulo propio del block (`add-to-cart.js`) con las redirecciones construidas desde `core/routes.js`; y la config de galería se declara una vez y se deriva para mobile/desktop (hoy está duplicada).

**Header.** Se elimina una de las dos UIs de auth (decisión de diseño de Sports Emotion: recomendamos quedarnos con el dropdown y retirar `renderAuthCombine`, que además contiene el demo `MH05` y el DOM-scraping por texto). Los tres paneles (search, mini-cart, wishlist) se convierten en un componente `panel.js` común con estados explícitos en JS (no en atributos `data-*` leídos como máquina de estados), y la navegación/accesibilidad de teclado se aísla en `nav.js`. Los textos pasan al sistema de placeholders.

Los ~25 micro-blocks de cuenta/pedido (9-90 líneas, wrappers casi vacíos de un container) se mantienen como blocks —el contrato con autores lo exige— pero su interior se reduce a una llamada a un helper común `mountDropinBlock(block, { container, capability, guard })`, quedando en 3-5 líneas cada uno.

### 5.7 Tipado: JSDoc + tsconfig sin build

Se añade un `tsconfig.json` que activa el chequeo sobre el código propio sin emitir nada:

```jsonc
{
  "compilerOptions": {
    "allowJs": true, "checkJs": true, "noEmit": true,
    "target": "es2022", "module": "es2022", "moduleResolution": "bundler",
    "strict": true,
    "paths": { "@dropins/*": ["./scripts/__dropins__/*"] }
  },
  "include": ["blocks/**/*.js", "scripts/**/*.js", "scripts/types/*.d.ts"],
  "exclude": ["scripts/aem.js", "scripts/__dropins__", "scripts/acdl", "scripts/commerce-events-*.js", "cypress", "node_modules"]
}
```

Con el mapeo de `paths`, los imports `@dropins/storefront-cart/api.js` resuelven contra los `.d.ts` reales que ya vienen en `__dropins__/` — hoy esa información de tipos existe y se desperdicia. El código propio se anota con JSDoc (`@param`, `@returns`, `@typedef`, `@type`); los tipos transversales viven en `scripts/types/`. `npm run typecheck` (`tsc --noEmit`) entra en CI y en el pre-commit junto al lint. El coste de adopción es incremental: se puede activar `strict` por carpetas empezando por `core/`.

### 5.8 Design system y theming de Sports Emotion

El mecanismo de theming de la plataforma es correcto y se conserva: un único bloque de custom properties bajo `:root, .dropin-design` re-tematiza a la vez el CSS propio y todos los componentes internos de los dropins. Lo que se cambia es la organización y la propiedad:

Los tokens actuales de Adobe se mueven a `styles/tokens/base.css` sin modificar (referencia estable frente a updates). La identidad de Sports Emotion vive exclusivamente en `styles/tokens/sports-emotion.css`, que sobreescribe la paleta (`--color-brand-*`), tipografía (`--type-*`, sustituyendo `adobe-clean` por la fuente de marca con `font-display: swap` y preload en `head.html`), formas y espaciados. Regla de oro: **ningún block ni sección usa colores/tamaños literales; todo va por token**. Stylelint puede hacerla cumplir (`declaration-property-value-allowed-list` para `color`, `background-color`, etc.). Se corrigen los tokens fantasma (B4) definiéndolos o eliminando los estilos huérfanos, y `lazy-styles.css` (hoy vacío) pasa a contener el CSS global below-the-fold de la marca.

Para componentes visuales propios de Sports Emotion que no existan como dropin (p. ej. fichas de producto deportivas, selector de tallas avanzado, comparadores), la vía es: block propio + tokens + slots de dropins cuando haya que inyectarse dentro de cart/checkout/PDP. Nunca fork del CSS interno de un dropin.

### 5.9 Eventos y analítica

Los dos buses se mantienen —cada uno tiene un propósito: el event-bus de dropins es comunicación de UI en tiempo real; el ACDL es la interfaz con analítica/Adobe— pero se les pone frontera y catálogo. Todo el código propio pasa por `core/events.js` (bus dropins) y por `domain/analytics.js` (ACDL): ningún block toca `window.adobeDataLayer` directamente. Los eventos propios del proyecto usan prefijo `se/` para distinguirse de los de dropins. `trackHistory` y la inicialización del data layer salen de `commerce.js` a `domain/analytics.js`, y quedan condicionados a `core/consent.js` real (B2). Los esquemas JSON de `scripts/acdl/schemas/` se referencian desde los `@typedef` de `scripts/types/events.d.ts` para que los payloads del ACDL también estén tipados.

### 5.10 Testing y CI

La pirámide que corresponde a este stack tiene tres niveles. En la base, **unit tests con Vitest + jsdom** sobre `core/`, `domain/` y `ui/` — precisamente el código que el refactor convierte en funciones puras y módulos sin side-effects (la máquina de estados del checkout, `routes.js`, `search-url.js` —que ya es ejemplar—, guards, slots). Vitest es devDependency pura; no afecta al runtime ni al no-build. En el medio, **tests de block** con Vitest + jsdom montando el HTML de entrada del block (fixtures `.plain.html` en `drafts/`) y verificando el DOM decorado. En la cima, la **suite Cypress existente**, adaptada: sustituir endpoints/SKUs demo por el backend real de Sports Emotion, parametrizar por entorno, y activar su ejecución en CI (hoy está gateada al repo de Adobe, B8) al menos en un job nightly y en PRs etiquetadas.

La CI del repo queda: en cada PR, `lint` + `typecheck` + `unit` (rápidos, obligatorios) + comentario automático con el enlace de preview `https://{branch}--{repo}--{owner}.aem.page/`; PSI/Lighthouse contra la preview como gate (el boilerplate de aem ya trae esta convención); Cypress smoke en PR y suite completa nightly contra staging. Se corrige además el desajuste de ramas `master`/`main` (B9) antes de nada, porque toda la maquinaria de aem.live asume `main`.

### 5.11 Convenciones y gobernanza

Las decisiones de arquitectura se registran como **ADRs** en `docs/adr/` (formato corto: contexto, decisión, consecuencias). Las primeras ADRs son las tres decisiones marco de este documento (JSDoc sin build; compatibilidad upstream; capas core/dropins/domain/ui). `AGENTS.md` se actualiza para reflejar la arquitectura de capas y las reglas de importación, de modo que tanto desarrolladores como agentes de IA generen código alineado. La *definition of done* de cualquier PR: lint + typecheck + unit verdes, README del block actualizado (el hook ya lo fuerza), textos por placeholders (nunca hardcodeados), estilos por tokens, sin nuevos imports con side-effects, enlace de preview en la descripción y PSI sin regresión.

---

## 6. Plan de migración por fases

Cada fase deja el proyecto funcionando y desplegable; ninguna requiere big-bang. Los tamaños son estimaciones para un equipo de 2 frontend senior familiarizándose con el stack.

| Fase | Contenido | Tamaño | Valor |
|---|---|---|---|
| **0 — Higiene** | Corregir B1–B10: bug `isAemAssetsEnabled`, `lang` dinámico, tokens fantasma, retirar demo `MH05` y strings hardcodeados a placeholders, alinear `master`→`main`, identidad del `package.json`, limpiar workflows/config demo. Añadir `tsconfig` + `typecheck` en CI (modo laxo). | ~1 semana | Inmediato: bugs reales fuera, base legal (consent pendiente de CMP), CI honesta |
| **1 — Core** | Crear `scripts/core/*` (config, events, routes, storage, graphql, i18n, auth, env, lifecycle, logger) extrayendo de `commerce.js`, que queda como fachada de re-export deprecada. Romper el ciclo commerce↔initializers. `import/no-cycle` a error. | ~2 semanas | El corazón del proyecto pasa a estar tipado, testeable y sin ciclos |
| **2 — Dropins + UI compartida** | Factory `createDropinInitializer` + `registry.js` (adiós side-effects y boilerplate x10). Crear `ui/`: guards (x16), image/swatch slots (x40/x4), product-link (x6), layout, notifications. Migrar los micro-blocks de cuenta a `mountDropinBlock`. Vitest operativo con primeros tests de `core/` y `ui/`. | ~2-3 semanas | Desaparece el 80% de la duplicación; añadir páginas/blocks nuevos se vuelve barato. **A partir de aquí ya se puede personalizar sobre base sólida** |
| **3 — Blocks críticos** | Checkout → `sections/` + `domain/checkout-flow.js` con tests de la máquina de estados. Product-details → separar SEO/add-to-cart/galería. Header → una sola auth UI, `panel.js`, `nav.js`, i18n completa. | ~3-4 semanas | Los tres puntos donde Sports Emotion más va a personalizar quedan extensibles |
| **4 — Testing/CI completos** | Adaptar Cypress al backend real, smoke en PR + nightly. PSI gate. Consent real (`core/consent.js` + CMP elegido). | ~2 semanas (paralelizable con 3) | Red de seguridad completa para el desarrollo del cliente |
| **5 — Theming Sports Emotion** | `styles/tokens/sports-emotion.css`, fuentes de marca, `lazy-styles.css`, primeros blocks de marca. | continuo | El trabajo de cliente propiamente dicho, ya sobre la nueva base |

Riesgos y mitigaciones: el mayor riesgo es refactorizar checkout (fase 3) sin red — por eso la suite Cypress de checkout se adapta *antes* de tocarlo (adelantar esa parte de la fase 4 si hace falta). El segundo es la divergencia con upstream — se mitiga porque todo lo nuevo vive en carpetas que el boilerplate no tiene (`core/`, `dropins/`, `domain/`, `ui/`, `tokens/`), y `commerce.js` como fachada mantiene compatibilidad de imports mientras dura la migración. El tercero es la regresión de rendimiento — cada fase termina con PSI contra preview; las capas nuevas no añaden peso a la fase eager (son los mismos módulos, mejor colocados).

---

## 7. Anti-patrones: qué NO vamos a hacer

Para que la ambición no se convierta en sobre-ingeniería, dejamos explícito lo descartado y por qué.

**No introducir un framework SPA** (React/Vue/routing cliente). EDS + dropins ya resuelven renderizado y componentes commerce; un framework encima duplicaría runtime, destrozaría el LCP y nos sacaría del camino soportado por Adobe. **No añadir bundler/transpilación** — decisión ya tomada; el tipado se logra con JSDoc. **No tocar `aem.js` ni editar `__dropins__/`** — la CI lo protege y las cuatro vías de extensión oficiales cubren las necesidades. **No forkear el CSS interno de los dropins** — se tematiza por tokens y se extiende por slots. **No cambiar el contrato de contenido de blocks existentes** sin plan de migración de contenido, porque rompe páginas publicadas. **No crear abstracciones especulativas**: la capa compartida crece solo cuando un patrón aparece por segunda vez, y cada abstracción nueva exige ADR. **No implantar gestores de estado externos** (Redux y similares): el estado de commerce ya vive en los dropins y su event-bus; nuestro trabajo es catalogarlo y tiparlo, no duplicarlo.

---

## Apéndice A — Correcciones inmediatas (fase 0)

| Ref | Acción concreta |
|---|---|
| B1 | `scripts/initializers/pdp.js:127`: `if (isAemAssetsEnabled)` → `if (isAemAssetsEnabled())` |
| B2 | Elegir CMP para Sports Emotion e implementar `core/consent.js`; hasta entonces, decidir conscientemente el default de `getConsent` (hoy `true` silencioso) |
| B3 | `scripts/scripts.js:143`: derivar `lang` del store/metadata en lugar de `'en'` fijo |
| B4 | `styles/styles.css:409-418`: definir `--light-color`/`--dark-color`/`--link-color`/`--link-hover-color` o eliminar los estilos huérfanos de `.secondary`/`.accent` |
| B5 | Retirar `renderAuthCombine.js:274` (producto demo MH05) junto con la decisión de auth UI única |
| B6 | Quitar los `await` sobre `getConfigValue` (`commerce.js:328`, `initializers/payment-services.js:17`) |
| B7 | Mover a placeholders los textos hardcodeados: `authPrivacyPolicyConsentSlot` (commerce.js), checkout-success, mini-PDP, seller-assisted banner, renderAuth* |
| B8 | Duplicar los workflows de e2e/Percy sin el gate `hlxsites/...` y parametrizados al backend propio (o eliminar hasta la fase 4) |
| B9 | Renombrar rama local a `main`, fijar identidad del repo en `package.json`, ejecutar la limpieza que `cleanup-on-create.yaml` no hizo (placeholders `{ORG}/{REPO}`, `.renovaterc.json`) |
| B10 | Sustituir `demo-config*.json` por la configuración del backend real; revisar que ninguna key demo quede referenciada |

## Apéndice B — Mapa de duplicaciones a consolidar (fase 2)

| Patrón duplicado | Ocurrencias hoy | Destino |
|---|---|---|
| Ritual placeholders+langDefinitions+mountImmediately | 10 initializers + mini-PDP | `dropins/create-initializer.js` |
| Auth-gate + redirect a login | 16 ficheros | `ui/guards.js` |
| Slot de imagen con `tryRenderAemAssetsImage` | ~40 usos en 16 ficheros | `ui/slots/image-slot.js` |
| `swatchImageSlot` | 4 copias idénticas | `ui/slots/swatch-slot.js` |
| `createProductLink` | 6 definiciones, 2 firmas | `ui/slots/product-link.js` |
| Redirección/reload post-auth | 5+ variantes | `core/routes.js` + `ui/guards.js` |
| Scaffold DOM + querySelectors | 7+ blocks | `ui/layout.js` (`data-ref`) |
| Edición vía mini-PDP | `commerce-cart` y `commerce-mini-cart` | módulo compartido en `ui/` |
| Shipping vs billing addresses (checkout) | 2 funciones ~90% idénticas | sección parametrizada por `addressType` |
| `decorateSections` | `aem.js` + `commerce.js` | usar una sola (documentar la divergencia intencional si la hay) |

---

*Documento generado a partir del análisis exhaustivo del código en `hiberus-magento/sports-emotion-storefront` (commit `bac1926`). Las rutas y números de línea citados corresponden a ese commit.*
