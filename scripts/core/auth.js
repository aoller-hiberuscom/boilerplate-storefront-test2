/**
 * core/auth.js — Estado de autenticación del cliente.
 *
 * Capa: core (solo puede importar de vendor y core).
 */
import { getCookie, COOKIES } from './storage.js';

/**
 * @returns {string|undefined} Token de usuario del dropin de auth, si existe
 */
export const getUserTokenCookie = () => getCookie(COOKIES.AUTH_TOKEN);

/**
 * Checks if the user is authenticated.
 * @returns {boolean} true if the user is authenticated
 */
export function checkIsAuthenticated() {
  return !!getUserTokenCookie();
}
