# Figma Design-System Extractor

## Overview

Turns the Figma design file into `docs/design-system/extract.json`: a compact,
machine-readable inventory of the design foundations — typography, colour, shape, spacing, grid,
motion and component states — with **real usage counts** for every value.

The counts are the point. They tell a system decision apart from a one-off: a text style used
12.878 times is the base of the system, one used 3 times is probably a mistake.

**Nobody on the team needs the Figma MCP or the ~360 MB dump.** The committed `extract.json` is
the shared source of truth. Run this script only when the design file changes.

## Why not the MCP

The Figma MCP is built for a different job: reading one frame so a model can generate a component.
It normalises and summarises the response, which is right for codegen but lossy for an audit — it
cannot tell you that `#18191A` appears 12.984 times and `#0F172A` only 1.152.

It is also chatty. Extracting a whole design system through it means dozens of API calls and
risks a `429`; the seat type matters, as Viewer and Collaborator seats have lower rate limits.
This tool makes **one** request for the whole document and does the rest locally.

## Scope: validated vs reference

Only the pages signed off with the client drive recommendations:

| Scope | Pages | Use |
| --- | --- | --- |
| `validated` | `PDP_V3`, `PDP Mobile_ V3` | The source of truth. Every token proposal comes from here. |
| `reference` | `Home`, `PLP` | Context only. **Never derive a token from these without checking the validated scope.** |

This split matters. `PLP` alone accounts for roughly two thirds of all colour usages in the file,
so aggregating every page silently lets an unvalidated design dominate the numbers.

WIP pages, discarded explorations, the `HUPS_*` annotation components (Hiberus review scaffolding)
and FigJam stickies are excluded — they are the file's own scaffolding, not product design.

## Prerequisites

- Node.js 18+ (uses the built-in `fetch`).
- A Figma personal access token in `FIGMA_TOKEN`, for the download step only.

## Running

```bash
export FIGMA_TOKEN=…            # never commit this
npm run extract                 # downloads the dump if missing, then extracts
```

The dump is ~360 MB, so Node needs a larger heap; `npm run extract` already passes
`--max-old-space-size=6144`. To reuse a dump you already have:

```bash
node --max-old-space-size=6144 extract.mjs --dump /path/to/figma-full.json
```

`figma-full.json` is gitignored: it is a build input, not a deliverable.

## Output

`docs/design-system/extract.json` (~50 KB):

| Key | Contents |
| --- | --- |
| `meta` | File key, extraction date, scope definition and caveats |
| `typography` | Named styles with family, weight, size, line height, tracking and usage per scope |
| `color` | Solid colours and gradients, counted per scope |
| `shape` | Corner radii, shadows and stroke weights |
| `spacing` | Auto Layout gaps and paddings |
| `grid` | Figma layout grids — columns, gutter, margin, column width |
| `motion` | Prototype interactions: trigger, transition, duration and easing |
| `layout.frameWidths` | Designed frame widths |
| `componentStates` | Component sets declaring a `State=` axis, with the visual delta per variant |

## Known gaps

- The file **publishes no styles and no Variables**. `/v1/files/:key/styles` returns 0 and
  `/v1/files/:key/variables/local` returns 403 — the named styles live in an external shared
  library. Typography values are therefore resolved from the nodes that render them.
- Because of that, the states of `Button_ficha`, `Button_main`, `icon-button` and `Input_text`
  are **not** in this file. Extracting them needs the library file key.

## Reading the output

The prose write-up generated from this data is `docs/DESIGN-SYSTEM-FIGMA.md`, and
`docs/design-system.local.html` renders it visually with the corporate typeface.
