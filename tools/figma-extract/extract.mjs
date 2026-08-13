/**
 * Figma design-system extractor.
 *
 * Reads a full Figma document dump and produces a compact, machine-readable
 * extract of the design foundations (typography, colour, shape, spacing, grid,
 * motion and component states), counting real usages so that the team can tell
 * a system decision from a one-off.
 *
 * The point of this tool is that nobody else needs the Figma MCP or the ~360 MB
 * dump: the committed `extract.json` is the shared source of truth, and this
 * script regenerates it whenever the design file changes.
 *
 * Usage:
 *   node extract.mjs [--dump <path>] [--out <path>] [--fetch]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const FILE_KEY = 'JjrWJbLhOgawub7L4HuNDZ';
const FILE_NAME = 'Futbol emotion_WEB';

/** Pages signed off with the client. These drive every recommendation. */
const VALIDATED = ['PDP_V3', 'PDP Mobile_ V3'];
/** Analysed for context only — proposals must not be derived from these. */
const REFERENCE = ['Home', 'PLP'];

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};

const dumpPath = resolve(arg('--dump', 'figma-full.json'));
const outPath = resolve(arg('--out', '../../docs/design-system/extract.json'));

// ---------------------------------------------------------------- fetch ----

async function fetchDump() {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('FIGMA_TOKEN is not set. Export a Figma personal access token.');
  process.stdout.write(`Downloading ${FILE_KEY} (this takes a couple of minutes)… `);
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
    headers: { 'X-Figma-Token': token },
  });
  if (!res.ok) throw new Error(`Figma API returned ${res.status}: ${await res.text()}`);
  writeFileSync(dumpPath, Buffer.from(await res.arrayBuffer()));
  console.log('done.');
}

// ---------------------------------------------------------------- utils ----

const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

/** Figma stores colour channels as 0..1 floats. */
function toHex({ r, g, b, a = 1 }, opacity) {
  const alpha = a * (opacity ?? 1);
  const hex = `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  return alpha >= 0.999 ? hex : `${hex}@${round(alpha, 2)}`;
}

function describePaint(paint) {
  if (paint.visible === false) return null;
  if (paint.type === 'SOLID') return toHex(paint.color, paint.opacity);
  if (paint.type?.startsWith('GRADIENT')) {
    const stops = (paint.gradientStops ?? [])
      .map((s) => `${toHex(s.color)} ${Math.round(s.position * 100)}%`)
      .join(', ');
    return `${paint.type}(${stops})`;
  }
  return null;
}

const bump = (map, key, n = 1) => { if (key != null) map.set(key, (map.get(key) ?? 0) + n); };
const sorted = (map) => Object.fromEntries([...map].sort((a, b) => b[1] - a[1]));

/**
 * Annotation scaffolding that belongs to the Figma file itself (Hiberus review
 * components and FigJam notes), not to the product design.
 */
const isScaffolding = (node) => node.name?.startsWith('HUPS') || node.type === 'STICKY';

// -------------------------------------------------------------- collect ----

function newBucket() {
  return {
    colors: new Map(),
    gradients: new Map(),
    spacing: new Map(),
    radii: new Map(),
    shadows: new Map(),
    strokeWeights: new Map(),
    textStyles: new Map(),
    grids: new Map(),
    motion: new Map(),
    frameWidths: new Map(),
  };
}

function collect(node, buckets, styleMap, scaffolding) {
  const skip = scaffolding || isScaffolding(node);

  if (!skip) {
    for (const b of buckets) {
      for (const paint of [...(node.fills ?? []), ...(node.strokes ?? [])]) {
        const desc = describePaint(paint);
        if (!desc) continue;
        bump(desc.startsWith('GRADIENT') ? b.gradients : b.colors, desc);
      }

      for (const key of ['itemSpacing', 'counterAxisSpacing', 'paddingLeft',
        'paddingRight', 'paddingTop', 'paddingBottom']) {
        const v = node[key];
        if (typeof v === 'number' && v > 0) bump(b.spacing, round(v, 2));
      }

      if (typeof node.cornerRadius === 'number') bump(b.radii, node.cornerRadius);
      for (const r of node.rectangleCornerRadii ?? []) bump(b.radii, r);
      if (typeof node.strokeWeight === 'number' && node.strokeWeight > 0) {
        bump(b.strokeWeights, node.strokeWeight);
      }

      for (const e of node.effects ?? []) {
        if (e.visible === false || !e.type?.includes('SHADOW')) continue;
        const { x = 0, y = 0 } = e.offset ?? {};
        bump(b.shadows, `${e.type} ${x}px ${y}px ${e.radius}px ${e.spread ?? 0}px ${toHex(e.color)}`);
      }

      const styleId = node.styles?.text;
      if (node.type === 'TEXT' && styleId && styleMap[styleId]) {
        bump(b.textStyles, styleMap[styleId].name);
      }

      for (const g of node.layoutGrids ?? []) {
        bump(b.grids, JSON.stringify({
          pattern: g.pattern,
          count: g.count,
          gutter: g.gutterSize,
          margin: g.offset,
          alignment: g.alignment,
          section: round(g.sectionSize ?? 0, 2),
        }));
      }

      for (const i of node.interactions ?? []) {
        for (const a of i.actions ?? []) {
          bump(b.motion, JSON.stringify({
            trigger: i.trigger?.type,
            action: a.type,
            transition: a.transition?.type ?? null,
            duration: a.transition?.duration ? round(a.transition.duration, 3) : null,
            easing: a.transition?.easing?.type ?? null,
          }));
        }
      }

      if (node.type === 'FRAME' && node.absoluteBoundingBox?.width) {
        bump(b.frameWidths, Math.round(node.absoluteBoundingBox.width));
      }
    }
  }

  for (const child of node.children ?? []) collect(child, buckets, styleMap, skip);
}

/** Typography values live on the nodes, so read one representative per style. */
function readTypography(node, styleMap, out, scaffolding) {
  const skip = scaffolding || isScaffolding(node);
  if (!skip && node.type === 'TEXT' && node.style) {
    const id = node.styles?.text;
    const name = id && styleMap[id] ? styleMap[id].name : null;
    if (name && !out.has(name)) {
      const s = node.style;
      out.set(name, {
        name,
        family: s.fontFamily,
        weight: s.fontWeight,
        size: s.fontSize,
        lineHeight: s.lineHeightPx ? round(s.lineHeightPx, 2) : null,
        letterSpacing: s.letterSpacing && s.fontSize
          ? `${round(s.letterSpacing / s.fontSize, 4)}em` : '0',
        decoration: s.textDecoration ?? null,
        case: s.textCase ?? null,
      });
    }
  }
  for (const child of node.children ?? []) readTypography(child, styleMap, out, skip);
}

/** Component variants that declare a `State=` axis, with their visual delta. */
function readStates(node, out, setName) {
  const name = node.type === 'COMPONENT_SET' ? node.name : setName;
  if (node.type === 'COMPONENT' && name && node.name?.includes('State=')) {
    const look = {};
    const fills = (node.fills ?? []).map(describePaint).filter(Boolean);
    const strokes = (node.strokes ?? []).map(describePaint).filter(Boolean);
    if (fills.length) look.fill = fills.join('+');
    if (strokes.length) look.stroke = `${strokes.join('+')} ${node.strokeWeight ?? 1}px`;
    if (typeof node.cornerRadius === 'number') look.radius = node.cornerRadius;
    if (node.opacity != null && node.opacity !== 1) look.opacity = round(node.opacity, 2);
    (out[name] ??= []).push({ variant: node.name, ...look });
  }
  for (const child of node.children ?? []) readStates(child, out, name);
}

const parseKeys = (map) => Object.entries(sorted(map))
  .map(([k, uses]) => ({ ...JSON.parse(k), uses }));

// ----------------------------------------------------------------- main ----

if (args.includes('--fetch') || !existsSync(dumpPath)) await fetchDump();

console.log(`Reading ${dumpPath}…`);
const doc = JSON.parse(readFileSync(dumpPath, 'utf8'));
const styleMap = doc.styles ?? {};

const validated = newBucket();
const reference = newBucket();
const typography = new Map();
const states = {};

for (const page of doc.document.children) {
  const inValidated = VALIDATED.includes(page.name);
  const inReference = REFERENCE.includes(page.name);
  if (!inValidated && !inReference) continue;

  const buckets = inValidated ? [validated] : [reference];
  for (const child of page.children ?? []) {
    collect(child, buckets, styleMap, false);
    readTypography(child, styleMap, typography, false);
  }
}

// Component sets are declared on their own pages, outside the design pages,
// so states are swept across the whole document.
for (const page of doc.document.children) readStates(page, states, null);

const shape = (b) => ({
  radii: sorted(b.radii),
  shadows: sorted(b.shadows),
  strokeWeights: sorted(b.strokeWeights),
});

const extract = {
  meta: {
    source: { fileKey: FILE_KEY, fileName: FILE_NAME, endpoint: `/v1/files/${FILE_KEY}` },
    extractedAt: new Date().toISOString().slice(0, 10),
    generatedBy: 'tools/figma-extract/extract.mjs',
    scope: {
      validated: VALIDATED,
      reference: REFERENCE,
      note: 'Only the validated pages are signed off with the client. Reference pages are '
        + 'context only: never derive a token from them without checking the validated scope.',
    },
    excluded: ['HUPS_* annotation components', 'FigJam stickies', 'WIP / discarded / test pages'],
    caveats: [
      'The file publishes no styles and no Variables; named styles come from an external library.',
      'Named text styles are resolved from node values, so weights reflect what is actually rendered.',
    ],
  },
  typography: {
    styles: [...typography.values()].map((s) => ({
      ...s,
      usesValidated: validated.textStyles.get(s.name) ?? 0,
      usesReference: reference.textStyles.get(s.name) ?? 0,
    })).sort((a, b) => b.size - a.size || b.usesValidated - a.usesValidated),
  },
  color: {
    validated: sorted(validated.colors),
    reference: sorted(reference.colors),
    gradients: { validated: sorted(validated.gradients), reference: sorted(reference.gradients) },
  },
  shape: { validated: shape(validated), reference: shape(reference) },
  spacing: { validated: sorted(validated.spacing), reference: sorted(reference.spacing) },
  grid: { validated: parseKeys(validated.grids), reference: parseKeys(reference.grids) },
  motion: { validated: parseKeys(validated.motion), reference: parseKeys(reference.motion) },
  layout: {
    frameWidths: { validated: sorted(validated.frameWidths), reference: sorted(reference.frameWidths) },
  },
  componentStates: states,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(extract, null, 1)}\n`);

const kb = Math.round(readFileSync(outPath).length / 1024);
console.log(`Wrote ${outPath} (${kb} KB)`);
console.log(`  typography: ${extract.typography.styles.length} named styles`);
console.log(`  colour:     ${Object.keys(extract.color.validated).length} validated / `
  + `${Object.keys(extract.color.reference).length} reference`);
console.log(`  grid:       ${extract.grid.validated.length} definitions`);
console.log(`  motion:     ${extract.motion.validated.length} interaction patterns`);
console.log(`  states:     ${Object.keys(extract.componentStates).length} component sets`);
