/**
 * core/events.js — Catálogo único de eventos + wrapper del event bus.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Todo el código propio debe usar estas constantes y este wrapper en lugar
 * de strings literales y del bus de dropins directamente. Los eventos
 * propios del proyecto usan el prefijo `se/` (Sports Emotion) para
 * distinguirse de los emitidos por los dropins.
 */
import { events } from '@dropins/tools/event-bus.js';

/**
 * Catálogo de eventos del event bus de dropins usados por el proyecto.
 * Referencia completa de los de dropins: types/events-catalog.d.ts en
 * scripts/__dropins__/tools/.
 */
export const EVENTS = Object.freeze({
  // Ciclo de vida de página (emitidos por nosotros)
  LCP: 'aem/lcp',

  // Eventos propios del proyecto (prefijo se/)
  CONSENT_CHANGED: 'se/consent-changed',

  // Auth
  AUTHENTICATED: 'authenticated',
  AUTH_GROUP_UID: 'auth/group-uid',
  AUTH_ACO: 'auth/adobe-commerce-optimizer',

  // Cart
  CART_INITIALIZED: 'cart/initialized',
  CART_DATA: 'cart/data',
  CART_UPDATED: 'cart/updated',
  CART_PRODUCT_ADDED: 'cart/product/added',
  CART_PRODUCT_UPDATED: 'cart/product/updated',

  // Checkout
  CHECKOUT_INITIALIZED: 'checkout/initialized',
  CHECKOUT_UPDATED: 'checkout/updated',
  CHECKOUT_VALUES: 'checkout/values',
  CHECKOUT_ADDRESSES_SHIPPING: 'checkout/addresses/shipping',
  CHECKOUT_ADDRESSES_BILLING: 'checkout/addresses/billing',

  // Order
  ORDER_DATA: 'order/data',
  ORDER_ERROR: 'order/error',
  ORDER_PLACED: 'order/placed',

  // PDP
  PDP_DATA: 'pdp/data',
  PDP_VALID: 'pdp/valid',
  PDP_VALUES: 'pdp/values',

  // Search / Wishlist / Recommendations
  SEARCH_RESULT: 'search/result',
  WISHLIST_ALERT: 'wishlist/alert',
});

/**
 * @param {string} event
 * @param {(payload: any) => void} handler
 * @param {{ eager?: boolean, scope?: string }} [options]
 * @returns {{ off: () => void }|void}
 */
export const on = (event, handler, options) => (
  events.on(/** @type {any} */ (event), handler, options)
);

/**
 * @param {string} event
 * @param {unknown} [payload]
 * @param {{ scope?: string }} [options]
 */
export const emit = (event, payload, options) => (
  events.emit(/** @type {any} */ (event), payload, options)
);

/**
 * @param {string} event
 * @returns {unknown} Último payload emitido para el evento, si existe
 */
export const lastPayload = (event) => events.lastPayload(/** @type {any} */ (event));

/** @param {boolean} enabled */
export const enableEventLogger = (enabled) => events.enableLogger(enabled);
