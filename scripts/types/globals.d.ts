/**
 * Globals del proyecto (EDS + commerce) para el type-checker.
 * Nota: .hlxignore excluye *.d.ts del publish; no se sirve en producción.
 */

interface HlxState {
  codeBasePath: string;
  lighthouse?: boolean;
  suppressFrame?: boolean;
  RUM_MASK_URL?: string;
}

interface PlaceholdersCache {
  _pending?: Record<string, Promise<object>>;
  _merged?: Record<string, unknown>;
  [key: string]: unknown;
}

interface IndexCacheEntry {
  data: unknown[];
  offset: number;
  complete: boolean;
  promise: Promise<IndexCacheEntry> | null;
}

interface Window {
  hlx: HlxState;
  placeholders?: PlaceholdersCache;
  index?: Record<string, IndexCacheEntry>;
  adobeDataLayer?: unknown[] & {
    push(...items: unknown[]): number;
    getState?(path?: string): unknown;
  };
}

interface Document {
  /** Prerendering API (speculation rules) */
  prerendering?: boolean;
}
