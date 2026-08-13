/**
 * Tests de core/storage.js — catálogo de claves y helpers de cookies.
 */
import {
  COOKIES, SESSION_KEYS, LOCAL_KEYS, getCookie, setCookie, clearCookie,
} from '../../../scripts/core/storage.js';

describe('core/storage', () => {
  it('los catálogos de claves están congelados', () => {
    expect(Object.isFrozen(COOKIES)).toBe(true);
    expect(Object.isFrozen(SESSION_KEYS)).toBe(true);
    expect(Object.isFrozen(LOCAL_KEYS)).toBe(true);
  });

  it('las claves críticas coinciden con las que usan los dropins', () => {
    expect(COOKIES.AUTH_TOKEN).toBe('auth_dropin_user_token');
    expect(COOKIES.WEBSITE_PATH).toBe('dropin_website_path');
    expect(SESSION_KEYS.CART_ID).toBe('DROPINS_CART_ID');
  });

  it('setCookie/getCookie/clearCookie funcionan sobre document.cookie', () => {
    setCookie('se_test_cookie', 'valor');
    expect(getCookie('se_test_cookie')).toBe('valor');

    clearCookie('se_test_cookie');
    expect(getCookie('se_test_cookie')).toBeFalsy();
  });
});
