/**
 * core/i18n.js — Placeholders (textos localizables) y locale de página.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Regla de proyecto: NINGÚN texto visible para el usuario se hardcodea en
 * JS. Todo texto va en las hojas de placeholders del contenido
 * (placeholders/*.json por store) y se consume vía fetchPlaceholders.
 */
import { getMetadata } from '../aem.js';
import { getRootPath, getConfigValue } from './config.js';
import { logger } from './logger.js';

/**
 * Locale de la página actual. Orden de resolución: metadata `lang` de la
 * página → clave `lang` del config del store → atributo actual → 'en'.
 * @returns {string}
 */
export function getPageLocale() {
  let configLang;
  try {
    configLang = getConfigValue('lang');
  } catch {
    configLang = undefined;
  }
  return getMetadata('lang') || configLang || document.documentElement.lang || 'en';
}

/**
 * Fetches and merges placeholder data from multiple sources with intelligent caching.
 *
 * Retrieves placeholder data from a path-specific file and optional fallback file,
 * then merges them together. Implements request deduplication to prevent multiple
 * simultaneous requests for the same resources and caches results.
 *
 * @param {string} [path] - Optional path to a specific placeholders file to include
 *                          in the merge. If not provided, returns all currently
 *                          cached placeholders.
 * @returns {Promise<object>} A promise that resolves the merged placeholders object.
 */
export async function fetchPlaceholders(path) {
  const rootPath = getRootPath();
  const fallback = getMetadata('placeholders');
  window.placeholders = window.placeholders || {};

  // Track pending requests to prevent duplicate fetches
  window.placeholders._pending = window.placeholders._pending || {};

  // Initialize merged results storage as a single merged object
  window.placeholders._merged = window.placeholders._merged || {};

  // If no path is provided, return the merged placeholders
  if (!path) {
    return Promise.resolve(window.placeholders._merged || {});
  }

  // Create cache key for this specific combination
  const cacheKey = [path, fallback].filter(Boolean).join('|');

  // Prevent empty cache keys
  if (!cacheKey) {
    return Promise.resolve({});
  }

  // Check if there's already a pending request for this combination
  if (window.placeholders._pending[cacheKey]) {
    return window.placeholders._pending[cacheKey];
  }

  // fetch placeholders
  const fetchPromise = new Promise((resolve) => {
    const promises = [];

    // Helper function to get or create fetch promise for a single resource
    const getOrCreateFetch = (url, resourceCacheKey) => {
      // Check if already cached
      if (window.placeholders[resourceCacheKey]) {
        return Promise.resolve(window.placeholders[resourceCacheKey]);
      }

      // Check if already pending
      if (window.placeholders._pending[resourceCacheKey]) {
        return window.placeholders._pending[resourceCacheKey];
      }

      // Create new fetch promise
      // Use force-cache to serve any available cache entry without revalidation,
      // reducing CDN traffic for static localization assets past their max-age.
      const resourceFetchPromise = fetch(`${url}?sheet=data`, { cache: 'force-cache' }).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          // Cache the response
          window.placeholders[resourceCacheKey] = data;
          return data;
        }
        logger.warn(`Failed to fetch placeholders from ${url}: HTTP ${response.status} ${response.statusText}`);
        return {};
      }).catch((error) => {
        logger.error(`Error fetching placeholders from ${url}:`, error);
        return {};
      }).finally(() => {
        // Remove from pending
        delete window.placeholders._pending[resourceCacheKey];
      });

      // Store pending promise
      window.placeholders._pending[resourceCacheKey] = resourceFetchPromise;
      return resourceFetchPromise;
    };

    // path
    if (path) {
      const pathUrl = rootPath.replace(/\/$/, `/${path}`);
      promises.push(getOrCreateFetch(pathUrl, path));
    }

    // fallback - only if it exists from overrides
    if (fallback) {
      promises.push(getOrCreateFetch(fallback, fallback));
    }

    Promise.all(promises)
      // process json from sources and combine them
      .then((jsons) => {
        // Early return if no data
        const hasData = jsons.some((json) => json.data?.length > 0);
        if (!hasData) {
          logger.warn(`No placeholder data found for path: ${path}${fallback ? ` and fallback: ${fallback}` : ''}`);
          resolve({});
          return;
        }

        // Create data object where later values override earlier ones
        const data = {};

        // Process all JSONs in one pass
        jsons.forEach((json) => {
          if (json.data?.length) {
            json.data.forEach(({ Key, Value }) => {
              if (Key && Value !== undefined) {
                data[Key] = Value;
              }
            });
          }
        });

        // Early return if no valid data
        if (Object.keys(data).length === 0) {
          logger.warn(`No valid placeholder data found after processing for path: ${path}${fallback ? ` and fallback: ${fallback}` : ''}`);
          resolve({});
          return;
        }

        // Convert data object to placeholders object with nested structure
        const placeholders = {};

        Object.entries(data).forEach(([Key, Value]) => {
          const keys = Key.split('.');
          const lastKey = keys.pop();
          let target = placeholders;

          // Navigate/create nested structure
          keys.forEach((key) => {
            target[key] = target[key] || {};
            target = target[key];
          });

          // Set the final value
          target[lastKey] = Value;
        });

        // Merge the new placeholders into the global merged object
        const merged = Object.assign(window.placeholders._merged, placeholders);

        resolve(merged);
      })
      .catch((error) => {
        logger.error(`Error loading placeholders for path: ${path}${fallback ? ` and fallback: ${fallback}` : ''}`, error);
        // error loading placeholders
        resolve({});
      });
  });

  // Store the pending promise for this combination
  window.placeholders._pending[cacheKey] = fetchPromise;

  // Clean up pending promise when resolved
  fetchPromise.finally(() => {
    delete window.placeholders._pending[cacheKey];
  });

  return fetchPromise;
}
