/**
 * core/storage.js — Catálogo ÚNICO de claves persistentes del proyecto.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Toda cookie, clave de sessionStorage o localStorage usada por el código
 * propio DEBE declararse aquí. Prohibido usar strings literales de claves
 * en blocks o en otras capas.
 */
import { getCookie } from '@dropins/tools/lib.js';

/** Cookies (algunas las escribe el propio dropin de auth/cart). */
export const COOKIES = Object.freeze({
  AUTH_TOKEN: 'auth_dropin_user_token',
  AUTH_FIRSTNAME: 'auth_dropin_firstname',
  WEBSITE_PATH: 'dropin_website_path',
  DROPIN_CART_ID: 'DROPIN__CART__CART-ID',
});

/** Claves de sessionStorage. */
export const SESSION_KEYS = Object.freeze({
  CONFIG: 'config',
  CART_ID: 'DROPINS_CART_ID',
  CART_DATA: 'DROPIN__CART__CART__DATA',
  CART_SHIPPING: 'DROPIN__CART__SHIPPING__DATA',
  FONTS_LOADED: 'fonts-loaded',
});

/** Claves de localStorage (las de historial se prefijan por store view). */
export const LOCAL_KEYS = Object.freeze({
  CART_AUTHENTICATED: 'DROPIN__CART__CART__AUTHENTICATED',
  PRODUCT_VIEW_HISTORY: 'productViewHistory',
  PURCHASE_HISTORY: 'purchaseHistory',
});

export { getCookie };

/** @param {string} name */
export function clearCookie(name) {
  document.cookie = `${name}=; path=/; Max-Age=0`;
}

/**
 * @param {string} name
 * @param {string} value
 */
export function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/`;
}
