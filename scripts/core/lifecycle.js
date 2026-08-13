/**
 * core/lifecycle.js — Arranque de la plataforma commerce y tipo de página.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * El flujo de arranque completo lo orquesta scripts/scripts.js:
 *   initializeCommerce() [este módulo: config + clientes GraphQL]
 *   → bootGlobalDropins() [scripts/dropins/registry.js]
 *   → decoración de página → capacidades por tipo de página → notifyUI('lcp')
 */
import { loadConfig } from './config.js';
import { initializeGraphQLClients } from './graphql.js';
import { EVENTS, emit, lastPayload } from './events.js';

/** Tipos de página commerce detectables. */
export const PAGE_TYPES = Object.freeze({
  PRODUCT: 'Product',
  CATEGORY: 'Category',
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  CMS: 'CMS',
});

/**
 * Inicializa configuración y clientes GraphQL. Una sola vez, en fase eager.
 * NO arranca dropins: eso es responsabilidad de scripts/dropins/registry.js
 * (así se evita el ciclo core ↔ dropins que tenía el boilerplate).
 * @returns {Promise<void>}
 */
export async function initializeCommerce() {
  await loadConfig();
  initializeGraphQLClients();
}

/**
 * Detects the page type based on DOM elements.
 * @returns {string} The detected page type (ver PAGE_TYPES)
 */
export function detectPageType() {
  if (document.body.querySelector('main .product-details')) {
    return PAGE_TYPES.PRODUCT;
  } if (document.body.querySelector('main .product-list-page')) {
    return PAGE_TYPES.CATEGORY;
  } if (document.body.querySelector('main .commerce-cart')) {
    return PAGE_TYPES.CART;
  } if (document.body.querySelector('main .commerce-checkout')) {
    return PAGE_TYPES.CHECKOUT;
  }
  return PAGE_TYPES.CMS;
}

/**
 * Notifies dropins about the current loading state (e.g. 'lcp').
 * @param {string} event The loading state to notify
 */
export function notifyUI(event) {
  // skip if the event was already sent
  if (lastPayload(`aem/${event}`) === event) return;
  // notify dropins about the current loading state
  const handleEmit = () => emit(`aem/${event}`);
  // listen for prerender event
  document.addEventListener('prerenderingchange', handleEmit, { once: true });
  // emit the event immediately
  handleEmit();
}

export { EVENTS };
