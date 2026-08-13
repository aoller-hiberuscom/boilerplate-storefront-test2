/**
 * core/routes.js — Rutas del storefront y construcción de URLs multi-store.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Único módulo propietario de las rutas de la aplicación. Ningún block debe
 * construir paths de páginas commerce con strings literales.
 */
import { getRootPath, getListOfRootPaths } from './config.js';
import { logger } from './logger.js';

/* -------------------- Rutas -------------------- */

export const SUPPORT_PATH = '/support';
export const PRIVACY_POLICY_PATH = '/privacy-policy';

// Guest
export const ORDER_STATUS_PATH = '/order-status';
export const ORDER_DETAILS_PATH = '/order-details';
export const RETURN_DETAILS_PATH = '/return-details';
export const CREATE_RETURN_PATH = '/create-return';
export const SALES_GUEST_VIEW_PATH = '/sales/guest/view/';

// Customer
export const CUSTOMER_PATH = '/customer';
export const CUSTOMER_ORDER_DETAILS_PATH = `${CUSTOMER_PATH}${ORDER_DETAILS_PATH}`;
export const CUSTOMER_RETURN_DETAILS_PATH = `${CUSTOMER_PATH}${RETURN_DETAILS_PATH}`;
export const CUSTOMER_CREATE_RETURN_PATH = `${CUSTOMER_PATH}${CREATE_RETURN_PATH}`;
export const CUSTOMER_ORDERS_PATH = `${CUSTOMER_PATH}/orders`;
export const CUSTOMER_RETURNS_PATH = `${CUSTOMER_PATH}/returns`;
export const CUSTOMER_ADDRESS_PATH = `${CUSTOMER_PATH}/address`;
export const CUSTOMER_LOGIN_PATH = `${CUSTOMER_PATH}/login`;
export const CUSTOMER_ACCOUNT_PATH = `${CUSTOMER_PATH}/account`;
export const CUSTOMER_FORGOTPASSWORD_PATH = `${CUSTOMER_PATH}/forgotpassword`;
export const SALES_ORDER_VIEW_PATH = '/sales/order/view/';

// Tracking
export const UPS_TRACKING_URL = 'https://www.ups.com/track';

/* -------------------- Helpers -------------------- */

/**
 * Sanitizes the given string by lowercasing, normalizing unicode and
 * replacing non-alphanumeric characters with dashes.
 * @param {string} name
 * @returns {string} sanitized name
 */
export function sanitizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Antepone el root path del store actual a una ruta.
 * @param {string} link url to be localized
 * @returns {string} The localized link
 */
export function rootLink(link) {
  const root = getRootPath().replace(/\/$/, '');

  // If the link is already localized, do nothing
  if (link.startsWith(root)) return link;
  return `${root}${link}`;
}

/**
 * Construye la URL canónica de un producto.
 * @param {string} urlKey
 * @param {string} sku
 * @returns {string}
 */
export function getProductLink(urlKey, sku) {
  if (!urlKey) {
    logger.warn('getProductLink: urlKey is missing or empty', { urlKey, sku });
  }
  if (!sku) {
    logger.warn('getProductLink: sku is missing or empty', { urlKey, sku });
  }
  const sanitizedUrlKey = urlKey ? sanitizeName(urlKey) : '';
  const sanitizedSku = sku ? sanitizeName(sku) : '';
  return rootLink(`/products/${sanitizedUrlKey}/${sanitizedSku}`);
}

/**
 * Localiza los enlaces de un contenedor al root path del store actual.
 * Respeta enlaces a otros stores y el flag `#nolocal`.
 * @param {Element} main - The main element
 */
export function decorateLinks(main) {
  const root = getRootPath();
  const roots = getListOfRootPaths();

  main.querySelectorAll('a').forEach((a) => {
    // If we are in the root, do nothing
    if (roots.length === 0) return;

    try {
      const url = new URL(a.href);
      const {
        origin,
        pathname,
        search,
        hash,
      } = url;

      // Skip localization if #nolocal flag is present
      if (hash === '#nolocal') {
        url.hash = '';
        a.href = url.toString();
        return;
      }

      // if the link belongs to another store, do nothing
      if (roots.some((r) => r !== root && pathname.startsWith(r))) return;

      // If the link is already localized, do nothing
      if (origin !== window.location.origin || pathname.startsWith(root)) return;
      a.href = new URL(`${origin}${root}${pathname.replace(/^\//, '')}${search}${hash}`).toString();
    } catch {
      logger.warn('Could not make localized link');
    }
  });
}
