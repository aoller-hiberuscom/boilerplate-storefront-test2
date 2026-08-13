/**
 * ui/guards.js — Guards de autenticación para blocks.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Sustituye el patrón repetido en 16 blocks:
 *   if (!checkIsAuthenticated()) { window.location.href = rootLink(LOGIN); } else { render... }
 */
import { checkIsAuthenticated } from '../core/auth.js';
import { rootLink, CUSTOMER_LOGIN_PATH, CUSTOMER_ACCOUNT_PATH } from '../core/routes.js';

/**
 * Ejecuta `render` solo si el usuario está autenticado; si no, redirige.
 * @template T
 * @param {() => T|Promise<T>} render
 * @param {{ redirectTo?: string }} [options]
 * @returns {Promise<T|undefined>}
 */
export async function requireAuth(render, { redirectTo = CUSTOMER_LOGIN_PATH } = {}) {
  if (!checkIsAuthenticated()) {
    window.location.href = rootLink(redirectTo);
    return undefined;
  }
  return render();
}

/**
 * Ejecuta `render` solo si el usuario NO está autenticado; si lo está, redirige.
 * @template T
 * @param {() => T|Promise<T>} render
 * @param {{ redirectTo?: string }} [options]
 * @returns {Promise<T|undefined>}
 */
export async function requireGuest(render, { redirectTo = CUSTOMER_ACCOUNT_PATH } = {}) {
  if (checkIsAuthenticated()) {
    window.location.href = rootLink(redirectTo);
    return undefined;
  }
  return render();
}
