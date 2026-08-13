/**
 * core/graphql.js — Clientes GraphQL del storefront y gestión de cabeceras.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Este módulo es el ÚNICO propietario de los dos clientes FetchGraphQL y de
 * toda mutación de sus cabeceras. Ningún otro módulo debe llamar a
 * setFetchGraphQlHeader directamente.
 */
import { FetchGraphQL } from '@dropins/tools/fetch-graphql.js';
import { getCoreEndpoint, getCatalogServiceEndpoint, getHeaders } from './config.js';

/** Cliente GraphQL de Commerce Core (cart, checkout, account, order…). */
export const CORE_FETCH_GRAPHQL = new FetchGraphQL();

/** Cliente GraphQL de Catalog Service (pdp, search, recommendations…). */
export const CS_FETCH_GRAPHQL = new FetchGraphQL();

/**
 * Creates a short hash from an object by sorting its entries and hashing them.
 * @param {object} obj - The object to hash
 * @param {number} [length] - Length of the resulting hash
 * @returns {string} A short hash string
 */
function createHashFromObject(obj, length = 5) {
  const objString = Object.entries(obj)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  return objString
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 2147483647, 0)
    .toString(36)
    .slice(0, length);
}

/**
 * Endpoint de Catalog Service con query param de cache-busting derivado de
 * las cabeceras (para segmentar la caché del CDN por contexto de cliente).
 * @returns {URL}
 */
export function catalogServiceEndpointWithQueryParams() {
  const urlWithQueryParams = new URL(getCatalogServiceEndpoint());
  const headers = getHeaders('cs');
  urlWithQueryParams.searchParams.append('cb', createHashFromObject(headers));
  return urlWithQueryParams;
}

/**
 * Configura endpoints y cabeceras base de ambos clientes.
 * Requiere que la config esté cargada (core/config.js#loadConfig).
 */
export function initializeGraphQLClients() {
  CORE_FETCH_GRAPHQL.setEndpoint(getCoreEndpoint());
  CORE_FETCH_GRAPHQL.setFetchGraphQlHeaders((prev) => ({ ...prev, ...getHeaders('all') }));

  CS_FETCH_GRAPHQL.setEndpoint(catalogServiceEndpointWithQueryParams().toString());
  CS_FETCH_GRAPHQL.setFetchGraphQlHeaders((prev) => ({ ...prev, ...getHeaders('cs') }));
}

/* ----------------------------------------------------- */
/* Mutadores de cabeceras (únicos autorizados a mutarlas) */
/* ----------------------------------------------------- */

/**
 * Añade o elimina la cabecera Authorization del cliente Core.
 * @param {boolean} authenticated
 * @param {string|undefined} token
 */
export function setAuthHeaders(authenticated, token) {
  if (authenticated && token) {
    CORE_FETCH_GRAPHQL.setFetchGraphQlHeader('Authorization', `Bearer ${token}`);
  } else {
    CORE_FETCH_GRAPHQL.removeFetchGraphQlHeader('Authorization');
  }
}

/** @param {string} customerGroupId */
export function setCustomerGroupHeader(customerGroupId) {
  CS_FETCH_GRAPHQL.setFetchGraphQlHeader('Magento-Customer-Group', customerGroupId);
}

/** @param {{ priceBookId?: string }|undefined} adobeCommerceOptimizer */
export function setAdobeCommerceOptimizerHeader(adobeCommerceOptimizer) {
  if (adobeCommerceOptimizer?.priceBookId) {
    CS_FETCH_GRAPHQL.setFetchGraphQlHeader('AC-Price-Book-ID', adobeCommerceOptimizer.priceBookId);
  } else {
    CS_FETCH_GRAPHQL.removeFetchGraphQlHeader('AC-Price-Book-ID');
  }
}
