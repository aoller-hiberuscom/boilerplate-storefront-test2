/**
 * Declaraciones de tipos para scripts/aem.js (vendor de Adobe, no modificable).
 * Este fichero sombrea aem.js para el type-checker (tsconfig checkJs): permite
 * tipar el código propio sin que tsc analice el core de Adobe.
 * Nota: .hlxignore excluye *.d.ts del publish; no se sirve en producción.
 */

export function setup(): void;
export function toClassName(name: string): string;
export function toCamelCase(name: string): string;
export function readBlockConfig(block: Element): Record<string, string>;
export function loadCSS(href: string): Promise<void>;
export function loadScript(src: string, attrs?: Record<string, string>): Promise<void>;
export function getMetadata(name: string, doc?: Document): string;
export function createOptimizedPicture(
  src: string,
  alt?: string,
  eager?: boolean,
  breakpoints?: Array<{ media?: string; width: string }>,
): Element;
export function decorateTemplateAndTheme(): void;
export function wrapTextNodes(block: Element): void;
export function decorateButtons(element: Element): void;
export function decorateIcon(span: Element, prefix?: string, alt?: string): void;
export function decorateIcons(element: Element, prefix?: string): void;
export function decorateSections(main: Element): void;
export function updateSectionsStatus(main: Element): void;
export function buildBlock(blockName: string, content: unknown): Element;
export function loadBlock(block: Element): Promise<Element>;
export function decorateBlock(block: Element): void;
export function decorateBlocks(main: Element): void;
export function loadHeader(header: Element): Promise<Element>;
export function loadFooter(footer: Element): Promise<Element>;
export function waitForFirstImage(section: Element): Promise<void>;
export function loadSection(
  section: Element,
  loadCallback?: (section: Element) => Promise<void> | void,
): Promise<Element>;
export function loadSections(element: Element): Promise<void>;
export function fetchPlaceholders(prefix?: string): Promise<Record<string, string>>;
export function sampleRUM(checkpoint: string, data?: Record<string, unknown>): void;
