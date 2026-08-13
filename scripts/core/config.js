/**
 * core/config.js — Fachada única de configuración del storefront.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Fuentes de configuración:
 *  - config.json remoto (cacheado en sessionStorage, expiración 2h)
 *  - motor de config de dropins (@dropins/tools/lib/aem/configs.js), que
 *    resuelve el bloque `public.default` fusionado con el del store actual.
 *
 * Nota: getConfigValue() es SÍNCRONA. No usar `await` sobre ella.
 */
import {
  getConfigValue,
  getHeaders,
  getRootPath,
  getListOfRootPaths,
  initializeConfig,
} from '@dropins/tools/lib/aem/configs.js';
import { SESSION_KEYS } from './storage.js';

/** Segundos de validez del config.json cacheado en sesión. */
const CONFIG_EXPIRY_SECONDS = 7200;

// Re-export del motor de config de dropins (único punto de paso permitido).
export {
  getConfigValue,
  getHeaders,
  getRootPath,
  getListOfRootPaths,
};

/**
 * Fetches config from remote and saves in session, then returns it, otherwise
 * returns it if it already exists and has not expired.
 * @returns {Promise<object>} The config JSON
 */
export async function getConfigFromSession() {
  const configURL = `${window.location.origin}/config.json`;

  try {
    const configJSON = window.sessionStorage.getItem(SESSION_KEYS.CONFIG);
    if (!configJSON) {
      throw new Error('No config in session storage');
    }

    const parsedConfig = JSON.parse(configJSON);
    if (
      !parsedConfig[':expiry']
      || parsedConfig[':expiry'] < Math.round(Date.now() / 1000)
    ) {
      throw new Error('Config expired');
    }
    return parsedConfig;
  } catch (e) {
    const config = await fetch(configURL);
    if (!config.ok) throw new Error('Failed to fetch config');
    const configJSON = await config.json();
    configJSON[':expiry'] = Math.round(Date.now() / 1000) + CONFIG_EXPIRY_SECONDS;
    window.sessionStorage.setItem(SESSION_KEYS.CONFIG, JSON.stringify(configJSON));
    return configJSON;
  }
}

/**
 * Carga config.json y lo inyecta en el motor de config de dropins.
 * Debe llamarse una única vez durante la fase eager (ver core/lifecycle.js).
 * @returns {Promise<void>}
 */
export async function loadConfig() {
  initializeConfig(await getConfigFromSession());
}

/* ------------------------------------------------------------------ */
/* Accesores tipados — añadir aquí cada clave de config que se consuma */
/* ------------------------------------------------------------------ */

/** @returns {string} Endpoint GraphQL de Commerce Core */
export const getCoreEndpoint = () => getConfigValue('commerce-core-endpoint') || getConfigValue('commerce-endpoint');

/** @returns {string} Endpoint GraphQL de Catalog Service */
export const getCatalogServiceEndpoint = () => getConfigValue('commerce-endpoint');

/** @returns {object|undefined} Configuración de Adobe Commerce Optimizer, si existe */
export const getAdobeCommerceOptimizerConfig = () => getConfigValue('adobe-commerce-optimizer');

/** @returns {object|undefined} Bloque `analytics` del config, si existe */
export const getAnalyticsConfig = () => getConfigValue('analytics');

/** @returns {string|undefined} Código del store view actual */
export const getStoreViewCode = () => getConfigValue('headers.cs.Magento-Store-View-Code');
