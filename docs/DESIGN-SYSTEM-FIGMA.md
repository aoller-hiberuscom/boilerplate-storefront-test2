# Design System / Foundations — Fútbol Emotion

Datos: [`docs/design-system/extract.json`](design-system/extract.json) · generado por
[`tools/figma-extract`](../tools/figma-extract/README.md) · 2026-08-12.

Fuentes: [Futbol emotion_WEB](https://www.figma.com/design/JjrWJbLhOgawub7L4HuNDZ/Futbol-emotion_WEB)
(file key `JjrWJbLhOgawub7L4HuNDZ`) y la web en producción `www.futbolemotion.com`.

> **Versión visual:** [`docs/design-system.html`](design-system.html) — renderiza la escala, las
> muestras de color, los gradientes, la rejilla, el movimiento y los estados con la **tipografía
> corporativa real**. Incrusta BeTheBest, la misma que ya sirve `futbolemotion.com` y que el
> storefront necesitará en producción; queda confirmar que la licencia cubre el nuevo dominio.

## Alcance y precedencia

Tres reglas, por orden:

1. **Solo la PDP está validada con cliente**, en desktop y mobile (`PDP_V3`, `PDP Mobile_ V3`).
   Todas las recomendaciones de este documento salen de ahí.
2. `Home` y `PLP` se han analizado como **referencia**, y van etiquetados como tales. No se deriva
   ningún token de ellas sin comprobarlo antes en el alcance validado.
3. Lo que el rediseño no cubre se rellena con **el planteamiento de la web actual**, porque la
   propuesta mejora solo algunas páginas; el resto se mantiene como está hoy. Cuando ese valor
   resulta ser un **valor por defecto de framework** y no una decisión de marca, se marca como
   pendiente en vez de adoptarse.

Separar el alcance no es un formalismo: **`PLP` sola aporta unos dos tercios de todos los usos de
color del archivo.** Agregando las cuatro páginas, una página sin validar dominaba las cifras y
distorsionaba las conclusiones. Los recuentos de este documento son solo de PDP salvo donde se
indique.

## Cómo se ha obtenido

El archivo de Figma **no publica estilos ni Variables** (`/v1/files/:key/styles` devuelve 0 y
`/variables/local` devuelve 403). Los estilos con nombre vienen de una **librería compartida
externa**, así que los valores tipográficos se resuelven leyendo los nodos que los renderizan.

Los datos salen de **una sola petición REST** (`GET /v1/files/:key`, ~360 MB) procesada en local.
No se ha usado el MCP de Figma: resume y normaliza la respuesta, lo cual es correcto para generar
código de un frame pero no permite contar usos. Detalle completo en el
[README del extractor](../tools/figma-extract/README.md).

**Los números son usos reales.** Sirven para distinguir el sistema de un accidente: un estilo con
3.389 usos es la base, uno con 3 probablemente sea un descuido.

Se excluyen las páginas WIP, descartes y pruebas, y el andamiaje del archivo (componentes `HUPS_*`
de anotación de Hiberus y notas de FigJam).

## 1. Tipografía

### Familias

| Familia | Rol | Dónde |
| --- | --- | --- |
| **Be the best** | Primaria | Toda la escala `Title` / `Heading` / `Body` / `Label` / `Caption` |
| **Inter** | Secundaria | Precio, nombre de producto, precio anterior, links |
| **Manrope** | Terciaria | `Sale info` (ahorro) y `Product tertiary inf` |

Pesos de *Be the best*: Regular 400, Semi Bold 600, Bold 700. Feature OpenType `ss01` activada en
el título de producto.

Residuales, **no son del sistema**: `Body/Body Large` (Roboto, 5 usos), `Body/Default/Regular` y
`Body/Small/Regular` (Noto Sans, 9). Restos de componentes pegados de otras librerías.

Los `woff2` de BeTheBest **ya existen y se sirven en producción** (ver §10). Queda confirmar el
alcance de la licencia antes de servirlos desde el nuevo storefront.

### Escala completa

`PDP` es el alcance validado; `ref` es Home + PLP, solo informativo.

| Estilo | Familia | Peso | Tamaño / Interlínea | Tracking | PDP | ref |
| --- | --- | --- | --- | --- | --- | --- |
| `Title/Title-2/Medium` | Be the best | **600** | 64 / 76 | −0.0125em | 5 | 55 |
| `Title/Title-2/Bold` | Be the best | 700 | 64 / 76 | −0.0125em | 1 | 21 |
| `Title/Title-3/Bold` | Be the best | 700 | 56 / 68 | −0.0107em | 6 | 0 |
| `Product price` | Inter | 700 | 48 / 58 | −0.0083em | 9 | 0 |
| `Heading/H2/Bold` | Be the best | 700 | 48 / 58 | −0.0083em | 9 | 23 |
| `Heading/H3/Bold` | Be the best | 700 | 40 / 48 | −0.0075em | 7 | 22 |
| `Heading/H3/Semi Bold` | Be the best | 600 | 40 / 48 | −0.0075em | 1 | 6 |
| `Heading/H4/Bold` | Be the best | 700 | 32 / 38 | −0.0063em | **41** | 26 |
| `Product name` | Inter | 700 | 32 / 38 | −0.0125em | 11 | 0 |
| `Heading/H4/Semi Bold` | Be the best | 600 | 32 / 38 | −0.0063em | 3 | 0 |
| `Heading/H5/Bold` | Be the best | 700 | 24 / 30 | −0.0063em | **158** | 223 |
| `Heading/H5/Regular` | Be the best | 400 | 24 / 30 | −0.0063em | 12 | 0 |
| `Heading/H6/Bold` | Be the best | 700 | 20 / 24 | 0 | **110** | 4 |
| `Heading/H6/Regular` | Be the best | 400 | 20 / 24 | 0 | 30 | 0 |
| `Heading/H6/Semi Bold` | Be the best | 600 | 20 / 24 | 0 | 9 | 0 |
| `Body/Body-1/Regular` | Be the best | 400 | 18 / 28 | 0 | **1.606** | 7.280 |
| `Body/Body-1/Medium` | Be the best | **400** | 18 / 28 | 0 | 50 | 186 |
| `Body/Body-2/Medium` | Be the best | **600** | 16 / 24 | 0 | **1.518** | 4.288 |
| `Label/Label-1/Semi Bold` | Be the best | 600 | 16 / 22 | −0.0113em | **368** | 558 |
| `Label/Label-1/Regular` | Be the best | 400 | 16 / 22 | −0.0113em | 163 | 93 |
| `Body/Body-2/Regular` | Be the best | 400 | 16 / 24 | 0 | 44 | 158 |
| `Label/Label-1/Bold` | Be the best | 700 | 16 / 22 | −0.0113em | 40 | 114 |
| `Sale info` | Manrope | 800 | 16 / 22 | −0.0113em | 23 | 10 |
| `Price before` | Inter | 600 | 16 / 22 · tachado | −0.0113em | 9 | 0 |
| `Label/Label-1/Medium` | Be the best | **400** | 16 / 22 | −0.0113em | 9 | 2 |
| `Body/Body-3/Regular` | Be the best | 400 | 14 / 20 | 0 | **612** | 439 |
| `Body/Body-3/Medium` | Be the best | **400** | 14 / 20 | 0 | 111 | 397 |
| `Label/Label-2/Semi Bold` | Be the best | 600 | 14 / 20 | −0.0114em | 104 | 52 |
| `Label/Label-2/Medium` | Be the best | **400** | 14 / 20 | −0.0114em | 46 | 32 |
| `Label/Label-2/Regular` | Be the best | 400 | 14 / 20 | −0.0114em | 40 | 0 |
| `Body/Body-3/Bold` | Be the best | 700 | 14 / 20 | 0 | 30 | 34 |
| `Label/Label-2/Bold` | Be the best | 700 | 14 / 20 | −0.0114em | 8 | 2 |
| `Body/Body-4/Regular` | Be the best | 400 | 12 / 16 | 0 | **3.389** | 9.489 |
| `link` | Inter | 600 | 12 / 14 · subrayado | 0 | 219 | 352 |
| `Caption/Caption-1/Medium` | Be the best | **600** | 12 / 14 | 0 | 146 | 1.045 |
| `Body/Body-4/Medium` | Be the best | **400** | 12 / 16 | 0 | 86 | 182 |
| `Product tertiary inf` | Manrope | 400 | 12 / 14 | 0 | 37 | 0 |
| `Label/Label-3/Semi Bold` | Be the best | 600 | 12 / 16 | −0.01em | 25 | 0 |
| `Label/Label-3/Medium` | Be the best | **400** | 12 / 16 | −0.01em | 25 | 0 |
| `Caption/Caption-1/Semi Bold` | Be the best | 600 | 12 / 14 | 0 | 16 | 72 |
| `Label/Label-3/Bold` | Be the best | 700 | 12 / 16 | −0.01em | 2 | 0 |
| `Caption/Caption-2/Medium` | Be the best | **400** | 10 / 12 | 0 | **3.009** | 8.696 |
| `Caption/Caption-2/Semi Bold` | Be the best | 600 | 10 / 12 | 0 | 6 | 0 |

### Hallazgos que hay que resolver antes de tokenizar

1. **`Medium` no significa nada consistente.** Es 400 en `Body-1`, `Body-3`, `Body-4`, `Label-1`,
   `Label-2`, `Label-3` y `Caption-2`; pero **600** en `Body-2`, `Caption-1` y `Title-2`.
2. **Seis pares son duplicados exactos**: `Body-1/Medium` = `Body-1/Regular`,
   `Body-3/Medium` = `Body-3/Regular`, `Body-4/Medium` = `Body-4/Regular`,
   `Label-1/Medium` = `Label-1/Regular`, `Label-2/Medium` = `Label-2/Regular`,
   `Caption-1/Medium` = `Caption-1/Semi Bold`. **Hay que colapsarlos, no arrastrarlos al CSS.**
3. **No existe `H1` ni `Title-1`.** La escala arranca en `Title-2` (64 px) y los `Heading` en `H2`.
   No se usan en ninguna página. Confirmar si existen en la librería.
4. **`Product name` (Inter) colisiona con `Heading/H4/Bold` (Be the best)**: mismo 32/38, distinta
   familia y tracking. Y el título de la PDP está puesto con *Be the best* inline, sin usar
   ninguno de los dos.
5. Tracking no redondo (−0.0113 y −0.0114 para niveles hermanos). Normalizar a −0.011em en labels,
   −0.006em en headings medios y −0.008em en los grandes.

## 2. Color

Ninguno es un estilo con nombre: todos son valores literales.

| Valor | PDP | ref | Uso real | Token propuesto |
| --- | --- | --- | --- | --- |
| `#18191A` | **12.984** | 27.861 | Texto principal y bordes de énfasis | `--color-neutral-900` |
| `#475569` | 2.960 | 7.752 | Texto secundario | `--color-neutral-700` |
| `#FDFDFD` | 2.335 | 6.662 | Fondo de página | `--color-neutral-50` |
| `#000000` | 1.472 | 2.898 | Etiquetas dentro de botones | — |
| `#343330` | 1.301 | 3.740 | Por defecto de Phosphor — **no es una decisión** | ninguno, ver abajo |
| `#64748B` | 1.286 | 3.365 | Texto terciario | `--color-neutral-600` |
| `#0F172A` | 1.152 | 9.561 | Iconos y botones de talla | ⚠️ duplicado de `#18191A` |
| `#CBD5E1` | 776 | 1.223 | Bordes | `--color-neutral-400` |
| `#F8FAFC` | 444 | 279 | Superficie secundaria: panel PDP, tabs | `--color-neutral-100` |
| `#FFFFFF @0.02` | 278 | 481 | Capa «Glass» sobre los CTAs | decorativa |
| `#94A3B8` | 183 | 559 | Bordes suaves, estado disabled | `--color-neutral-500` |
| `#F87171` | 136 | 66 | Fondo de chips de etiqueta y promoción | `--color-chip-promo` |
| `#FFFFFF` | 114 | 924 | Blanco puro | `--color-neutral-0` |
| `#F2F2F2` | 108 | 217 | Fondos alternos | `--color-neutral-200` |
| `#F1F5F9` | 87 | 10 | Suela no seleccionada | `--color-neutral-200` |
| `#FFE95D` | 59 | 356 | Moneda del programa Member | `--color-member-coin` |
| `#FEF9C3` | 35 | 0 | Fondo de aviso en acordeones | `--color-warning-200` |

### Correcciones al agregar solo la PDP

Rescopar cambió conclusiones reales, y merece la pena dejarlas escritas:

- **`#CCD6E0` no existe en la PDP** (853 usos, todos en PLP: el panel de filtros). Estaba
  propuesto como `--color-border-control`; **queda fuera** del set validado.
- **`#171A1A` tampoco existe en la PDP** (492 usos, todos fuera).
- **`#0F172A` pierde peso**: era el segundo color del archivo con 10.713 usos, pero en la PDP son
  1.152 frente a 9.561 en PLP. Sigue siendo un duplicado que hay que colapsar, pero **es
  principalmente un problema de PLP**, no del diseño validado.

### Los negros duplicados

En la PDP conviven `#18191A` (12.984), `#000000` (1.472), `#0F172A` (1.152), `#0F0F0F` (350) y
`#111111` (33). Visualmente indistinguibles. **Deben colapsar en `#18191A`**, salvo el `#000000`
de las etiquetas de botón, que conviene revisar aparte.

### Dos rampas de gris en paralelo

La **Slate de Tailwind** (`#F8FAFC`, `#F1F5F9`, `#CBD5E1`, `#94A3B8`, `#64748B`, `#475569`) y una
rampa propia de múltiplos de `0x1A` (`#EDEDED`, `#D4D4D4`, `#B3B3B3`, `#808080`, `#4D4D4D`). La
Slate gana por volumen. Que los valores coincidan con Tailwind no implica adoptar Tailwind
(ver `docs/adr/0005`): son solo hex.

### `#343330` no es un token

Con 1.301 usos parece una decisión, pero es el **color por defecto de Phosphor Icons**. Los iconos
no están tematizados: en implementación deben heredar `currentColor`.

### El acento es un gradiente

No existe como color plano en ningún sitio.

```css
/* CTA primario · 190 usos en PDP — la firma visual del sistema */
linear-gradient(124deg, #ff8c00 0%, #ffd157 100%)

/* Relleno dorado premium · 29 */
radial-gradient(circle at 42% 41%, #fff 24%, #ffbc47 71%, #c73200 100%)

/* Dorado lineal · 14 */
linear-gradient(#fff 24%, #d99d1d 87%, #b36e00 100%)

/* Borde cobre del CTA de personalización · 14 */
linear-gradient(131deg, #bd7c4e 45%, #824323 77%)

/* Velo marino sobre imagen (player cards, heros) */
linear-gradient(rgb(0 24 56 / 0%) 0%, #001838 100%)
```

⚠️ **No hay paleta semántica de estado.** El único color con función real de estado es `#FEF9C3`
(aviso), con 35 usos. Se cubre parcialmente con la web actual en §10.

## 3. Rejilla

Los layout grids **sí están definidos** en Figma, y la matemática cuadra exacta:

| Alcance | Columnas | Gutter | Margen | Ancho de columna | Total |
| --- | --- | --- | --- | --- | --- |
| Desktop | **12** | **2 px** | 0 | 118,17 px | 12×118,17 + 11×2 = **1440** |
| Mobile | **4** | **2 px** | 0 | 92,25 px | 4×92,25 + 3×2 = **375** |
| Mobile (12 col) | 12 | 2 px | 0 | 29,42 px | 12×29,42 + 11×2 = **375** |

Todos `STRETCH` y **sin márgenes laterales**: el contenido llega al borde del viewport y la
separación la da el gutter.

Esto explica por qué `2px` tiene 8.314 usos de espaciado: **no es un capricho, es el gutter de la
rejilla.** Cualquier block que se implemente debería apoyarse en estas columnas.

## 4. Movimiento

14.742 interacciones de prototipo en el archivo, 3.500 de ellas en la PDP. Es una capa entera que
no estaba documentada, y define un sistema de transición bastante claro:

| Disparador | Transición | Duración | Easing | Usos PDP |
| --- | --- | --- | --- | --- |
| `ON_HOVER` | `SMART_ANIMATE` | **300 ms** | `EASE_IN_AND_OUT` | 2.081 |
| `ON_CLICK` | `SMART_ANIMATE` | **200 ms** | `EASE_IN_AND_OUT` | 448 |
| `ON_HOVER` | instantánea | — | — | 354 |
| `ON_HOVER` | `SMART_ANIMATE` | 200 ms | `EASE_IN_AND_OUT` | 204 |
| `AFTER_TIMEOUT` | `SMART_ANIMATE` | 3.125 ms | `SLOW` | 127 |
| `ON_CLICK` | `MOVE_IN` | 300 ms | `EASE_IN_AND_OUT` | 38 |

Se traduce casi literalmente a CSS:

```css
--motion-duration-hover: 300ms;
--motion-duration-press: 200ms;
--motion-easing: ease-in-out;
```

`SMART_ANIMATE` interpola propiedades entre variantes, o sea **`transition` de CSS**, no keyframes.
Los `AFTER_TIMEOUT` de ~3,1 s son el autoplay del vídeo 360º y los carruseles. `MOVE_IN` es el
patrón de drawer o modal.

Esto **responde al pendiente de `Position gradient`**: sí, los CTAs animan en hover, 300 ms
ease-in-out.

## 5. Forma

### Radios

| Valor | Usos PDP | Uso |
| --- | --- | --- |
| `4px` | **3.243** | Radio por defecto del sistema |
| `10000px` / `100000px` / `100px` / `50px` | 371 / 63 / 22 / 203 | Pill — cuatro valores para lo mismo |
| `23px` | 273 | Capa de color interna de los botones (media altura de 46 px) |
| `2px` | 114 | Etiqueta promo |
| `16px` | 99 | Contenedores |
| `1px` | 96 | Controles pequeños |
| `24px` | 47 | Tarjetas |
| `8px` | 26 | Tab activa |

⚠️ Corrección de alcance: `3px`, `12px` y `20px` **no aparecen en la PDP**; venían de otras
páginas. Y `8px` es mucho más débil de lo que parecía (26 usos, no 120).

### Sombras

```css
/* chips · 187 usos */           box-shadow: 1px 1px 4px 3px rgb(0 0 0 / 10%);
/* botones elevados · 76 */      box-shadow: 1px 1px 12px 6px rgb(0 0 0 / 25%);
/* sutil · 75 */                 box-shadow: 1px 1px 4px 0 rgb(0 0 0 / 15%);
```

Las tres tienen **offset 1px/1px** en lugar de vertical puro, y las dos primeras un **spread muy
alto**. Quedan pesadas y desplazadas en diagonal: conviene normalizarlas con diseño.

### Grosores de borde

`1px` (por defecto) · `1.5px` (icon-buttons e iconos) · `2px` (borde en gradiente) · `4px` (foco).

## 6. Espaciado y layout

| Valor | Usos PDP | | Valor | Usos PDP |
| --- | --- | --- | --- | --- |
| `10px` | **10.204** | | `12px` | 520 |
| `2px` | 8.314 | | `3px` | 230 |
| `4px` | 4.135 | | `40px` | 174 |
| `16px` | 2.586 | | `32px` | 160 |
| `8px` | 2.479 | | `42px` | 152 |
| `6px` | 1.608 | | `48px` | 144 |
| `24px` | 727 | | | |

Escala mixta de base 2, 4 y 6. Los tokens `--spacing-*` del proyecto cubren 4/8/16/24/32/40/48 pero
**no 2, 6, 10 ni 12**. Con `10px` en 10.204 usos y `2px` (el gutter) en 8.314, lo realista es
**añadir los tokens**, no normalizar.

### Medidas

| Medida | Valor |
| --- | --- |
| Frame desktop | **1440 px** · rejilla de 12 columnas |
| Frame mobile | **375 px** · rejilla de 4 columnas, contenido a 327 px |
| PDP above-the-fold | Galería 840 px + panel producto 600 px, gap 2 px |
| Padding del panel de producto | `48px 24px` |
| Altura de CTA | 44 px · padding 10 px |
| Icon-button | 36 × 36 px |
| Altura de fila de tallas | 56 px |

## 7. Iconografía

**Phosphor Icons**, confirmado por nombres, variantes (`Format = Stroke | Outline`,
`Weight = Regular | Fill`) y por el color por defecto `#343330`.
Tamaños: 16 / 18 / 20 / 24 px. Trazo: 1.5 px.

## 8. Inventario de componentes (PDP)

| Componente | Variantes / propiedades |
| --- | --- |
| `Button_ficha` | `Jerarquía = Primary \| Secondary`, `Type = Añadir`, `State`, `Position gradient` |
| `Button_main` | `Jerarquía = Tertiary`, `Type = Desktop`, `State`, `Position gradient` |
| `icon-button` | `Type = Secondary`, `State`, `Size = Small` |
| `Chip_important` | `Type = Promocion \| Interactive`, `State` |
| `Tab` | `Selected \| Non active-default` |
| `Selector-colores-suelas` | `State`, `Type = Tab colores` |
| `Input_text` | `State = enabled`, `helper`, `Style = filled`, `Label` |
| `.Input_label` | `Required`, `Icon` |
| `Add actionV2` | `Type of talla`, `Personalizacion`, `Talla view`, `State` |
| `product-resume- v2` | `Personalización`, `Filled`, `Items`, `Product` |
| `Promocionv2` | Flash sale + hasta 3 promos conmutables |
| `Historic info sale` | `Best price`, `State`, `Type = Desktop` |
| `ETIQUETA PROMO`, `Attention` | `Step`, `Colour = black \| white` |
| `Link`, `Heart icon`, `Info sale icon`, `IMGs`, `video-3d-2` | — |

## 9. Estados de componente

17 component sets declaran eje `State`. Los botones principales (`Button_ficha`, `Button_main`,
`icon-button`, `Input_text`) **viven en la librería externa** y sus estados no están en este
archivo.

### Botón de talla — el patrón de referencia

Único componente con los cuatro estados resueltos y coherentes:

| Estado | Borde | Fondo | Texto / icono |
| --- | --- | --- | --- |
| Default | `1px #18191A` | — | `#18191A` |
| Hover | **`4px #18191A`** | — | `#18191A` |
| Pressed | `4px #18191A` | `#18191A` | `#FDFDFD` |
| Disabled | `1px #94A3B8` | — | `#CBD5E1` |

Dos reglas generalizables: **el hover/focus engorda el borde de 1 a 4 px sin cambiar de color**, y
el pressed **invierte fondo y texto**. Combinado con §4, la transición es de 300 ms ease-in-out.

### Resto

| Component set | Estados | ¿Diferenciados? |
| --- | --- | --- |
| `Boton talla` | Default · Hover · Pressed · Disabled | Sí, completo |
| `row` | Default · Hover (`#1A1A1A` al 10%) · Disabled (`#94A3B8`) | Parcial |
| `Suela` | Default (`#F1F5F9` + sombra) · Selected (`#18191A`) | Sí |
| `accordion` | Default · Opened | Solo cambia el contenido |
| `Tab` | Default · Hover · Selected | **No** — sombra invertida |
| `Product card` | Default · Hover | **No** — solo el radio, de 4 a 3,55 px |
| `Estructura`, `Tallas_`, `Tab-info product` | variantes de contenido | No son estados |

### Dos defectos a confirmar con diseño

1. **`row · Disabled` deja la etiqueta activa.** El texto se apaga a `#94A3B8` pero
   «Disponibilidad inmediata» sigue en `#18191A`: una fila deshabilitada parece disponible.
2. **`Tab` tiene la sombra invertida.** El `drop-shadow` está en `Default` en vez de en `Selected`,
   así que la pestaña activa se ve más plana que las inactivas.

## 10. Huecos cubiertos con la web actual

Extraído de `futbolemotion.com`.

### Tipografía: los archivos ya existen

| Familia | Peso | Archivo |
| --- | --- | --- |
| `BeTheBest` | 400 | `Bethebest-Regular.woff2` |
| `BeTheBest` | 600 | `Bethebest-Semibold.woff2` |
| `BeTheBest` | 700 | `Bethebest-Bold.woff2` |
| `BeTheBestExt` | 700 | `Bethebest-BoldExt.woff` ⚠️ **no aparece en el Figma** |

Que ya se sirvan en producción es indicio fuerte de que la licencia webfont existe, pero **no es un
dictamen legal**: confirmar el alcance antes de servirlas desde el nuevo storefront.

### Paleta semántica

| Valor | Uso en la web actual | ¿Adoptable? |
| --- | --- | --- |
| `#F53F3F` | Error e inválido — **y también descuento** | Sí, separando los dos usos |
| `#FDDFDF` | Fondo de mensaje de error | Sí |
| `#0E8756` | Válido y éxito | Sí — decisión de marca real |
| `#FFF700` | Realce de stock | Sí |
| `--bs-warning`, `--bs-info`, `--bs-danger` | Aviso, info, peligro | **No** — por defecto de Bootstrap |

### Breakpoints

| Origen | Valores |
| --- | --- |
| Figma | 375 · 1440 (solo dos anchos diseñados) |
| Web actual | 576 · 768 · 992 · **1200** · 1860 · 2560 (Bootstrap 5) |
| Proyecto EDS | 600 · 900 · **1200** |

⚠️ Solo coincide 1200. Y el contenedor de la web llega a `1780–2048 px`, muy por encima de los
1440 px del Figma: **hay que decidir explícitamente qué pasa por encima de 1440**.

## 11. Tokens propuestos para `styles/styles.css`

Sustituyen el bloque **SPORTS EMOTION — THEME OVERRIDES** (`styles/styles.css:661`). Duplicados
colapsados, negros unificados, alcance PDP, y los huecos de la web marcados en el comentario.
La base de rem del proyecto es 10 px (`1.6rem` = 16 px).

```css
:root,
.dropin-design {
  /* --- Neutrales · PDP (rampa Slate, la dominante) --- */
  --color-neutral-0: #fff;
  --color-neutral-50: #fdfdfd;    /* fondo de página */
  --color-neutral-100: #f8fafc;   /* superficie secundaria: panel PDP, tabs */
  --color-neutral-200: #f1f5f9;
  --color-neutral-300: #e2e8f0;
  --color-neutral-400: #cbd5e1;   /* bordes */
  --color-neutral-500: #94a3b8;   /* borde disabled */
  --color-neutral-600: #64748b;   /* texto terciario */
  --color-neutral-700: #475569;   /* texto secundario */
  --color-neutral-900: #18191a;   /* colapsa 0F172A / 0F0F0F / 111111 */

  /* --- Acento de marca · PDP --- */
  --color-brand-300: #ffd157;
  --color-brand-500: #ff8c00;
  --color-brand-600: #d99d1d;
  --color-brand-700: #b36e00;
  --gradient-cta-primary: linear-gradient(124deg, #ff8c00 0%, #ffd157 100%);
  --gradient-cta-premium: linear-gradient(131deg, #bd7c4e 45%, #824323 77%);
  --gradient-gold-fill: radial-gradient(circle at 42% 41%, #fff 24%, #ffbc47 71%, #c73200 100%);
  --gradient-image-veil: linear-gradient(rgb(0 24 56 / 0%) 0%, #001838 100%);

  /* --- Color funcional · PDP --- */
  --color-member-coin: #ffe95d;
  --color-chip-promo: #f87171;
  --color-warning-200: #fef9c3;   /* fondo de aviso en acordeones */

  /* --- Semántica · WEB ACTUAL (el Figma no tiene ninguna) --- */
  --color-alert-500: #f53f3f;     /* error e inválido */
  --color-alert-200: #fddfdf;
  --color-positive-500: #0e8756;  /* válido y éxito */
  --color-stock-highlight: #fff700;
  /* PENDIENTE: --color-warning-500 y --color-informational-* no existen como decisión
     de marca; en la web actual son los valores por defecto de Bootstrap.
     PENDIENTE: separar el rojo de error del de descuento (hoy comparten #f53f3f). */

  /* --- Rejilla · PDP --- */
  --grid-columns-desktop: 12;
  --grid-columns-mobile: 4;
  --grid-gutter: 2px;             /* explica los 8.314 usos de 2px */
  --grid-margin: 0;

  /* --- Movimiento · PDP --- */
  --motion-duration-hover: 300ms;
  --motion-duration-press: 200ms;
  --motion-easing: ease-in-out;

  /* --- Estados · PDP (patrón del botón de talla) --- */
  --state-focus-border-width: 4px;   /* engorda el borde, no cambia el color */
  --state-pressed-bg: var(--color-neutral-900);
  --state-pressed-fg: var(--color-neutral-50);
  --state-disabled-border: var(--color-neutral-500);
  --state-disabled-fg: var(--color-neutral-400);
  --state-row-hover-bg: rgb(26 26 26 / 10%);

  /* --- Forma · PDP --- */
  --shape-border-radius-1: 4px;   /* radio por defecto: 3.243 usos */
  --shape-border-radius-2: 16px;
  --shape-border-radius-3: 24px;
  --shape-border-radius-pill: 9999px;
  --shape-shadow-1: 1px 1px 4px 0 rgb(0 0 0 / 15%);
  --shape-shadow-2: 1px 1px 4px 3px rgb(0 0 0 / 10%);
  --shape-shadow-3: 1px 1px 12px 6px rgb(0 0 0 / 25%);

  /* --- Espaciado que falta en la escala base · PDP --- */
  --spacing-xxxsmall: 2px;        /* = gutter de la rejilla */
  --spacing-xxsmall-plus: 6px;
  --spacing-xsmall-plus: 10px;    /* el más usado del sistema: 10.204 */
  --spacing-small-minus: 12px;

  /* --- Tipografía · PDP (base rem = 10px) --- */
  --type-base-font-family: 'BeTheBest', inter, adobe-clean, sans-serif;
  --type-display-font-family: 'BeTheBestExt', 'BeTheBest', sans-serif;  /* WEB ACTUAL */
  --type-numeric-font-family: inter, adobe-clean, sans-serif;
  --type-display-1-font: normal normal 700 6.4rem/7.6rem var(--type-base-font-family);
  --type-display-1-letter-spacing: -0.0125em;          /* Title-2 */
  --type-display-2-font: normal normal 700 5.6rem/6.8rem var(--type-base-font-family);
  --type-display-2-letter-spacing: -0.0107em;          /* Title-3 */
  --type-display-3-font: normal normal 700 4.8rem/5.8rem var(--type-base-font-family);
  --type-display-3-letter-spacing: -0.0083em;          /* H2 */
  --type-headline-1-font: normal normal 700 4rem/4.8rem var(--type-base-font-family);
  --type-headline-1-letter-spacing: -0.0075em;         /* H3 */
  --type-headline-2-strong-font: normal normal 700 3.2rem/3.8rem var(--type-base-font-family);
  --type-headline-2-strong-letter-spacing: -0.006em;   /* H4 */
  --type-headline-2-default-font: normal normal 700 2.4rem/3rem var(--type-base-font-family);
  --type-headline-2-default-letter-spacing: -0.006em;  /* H5 */
  --type-body-1-default-font: normal normal 400 1.8rem/2.8rem var(--type-base-font-family);
  --type-body-1-strong-font: normal normal 600 1.6rem/2.4rem var(--type-base-font-family);
  --type-body-2-default-font: normal normal 400 1.4rem/2rem var(--type-base-font-family);
  --type-button-2-font: normal normal 600 1.6rem/2.2rem var(--type-base-font-family);
  --type-button-2-letter-spacing: -0.011em;            /* Label-1/Semi Bold */
  --type-details-caption-1-font: normal normal 400 1.2rem/1.6rem var(--type-base-font-family);
  --type-details-caption-2-font: normal normal 400 1rem/1.2rem var(--type-base-font-family);
}
```

## 12. Pendientes

| Pendiente | Estado | Nota |
| --- | --- | --- |
| Aviso e info semánticos | **Bloqueante** | La web solo tiene los de Bootstrap |
| Separar el rojo de error del de descuento | **Bloqueante** | Hoy ambos son `#F53F3F` |
| Comportamiento por encima de 1440 px | **Bloqueante** | Figma 1440 vs contenedor real 1780–2048 |
| Estados de `Button_ficha`, `Button_main`, `icon-button`, `Input_text` | Abierto | **Necesita la clave del archivo de librería** |
| ¿Existen `H1` y `Title-1`? | Abierto | Ídem: están en la librería |
| Breakpoints intermedios (600 / 900) | Abierto | No hay diseño |
| `Tab` y `Product card` sin estado visible | Abierto | ¿Descuido o intencionado? |
| `row · Disabled` deja la etiqueta activa | Abierto | Parece un defecto |
| ¿`BeTheBestExt` entra en el sistema? | Abierto | Está en la web, no en el Figma |
| `Product name` vs `Heading/H4/Bold` | Abierto | Colisión: decidir cuál manda |
| Validar Home y PLP con cliente | Abierto | Hasta entonces son solo referencia |
| Licencia webfont de BeTheBest | Casi cerrado | Ya se sirve en producción; confirmar alcance |
| Higiene del archivo de Figma | Recomendado | Publicar Variables, colapsar duplicados y negros |

Cuando se cierren los tres bloqueantes, este documento es la fuente para reescribir el bloque de
theme overrides de `styles/styles.css` (regla del proyecto: ningún block usa color o tipo literal
fuera de tokens — ver `docs/adr/0005-theming-por-tokens.md`).
