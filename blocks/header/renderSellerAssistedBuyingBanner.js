/**
 * blocks/header/renderSellerAssistedBuyingBanner.js — Banner de sesión de
 * compra asistida por vendedor (Seller Assisted Buying).
 *
 * Responsabilidad:
 *  - Detectar la sesión de administrador (cookie de sesión admin del dropin
 *    de auth) y construir el banner fijo superior con el nombre del cliente
 *    y el website, más el botón de cierre de sesión.
 *  - Retirar el banner cuando la sesión termina (evento `authenticated`).
 */
import * as authApi from '@dropins/storefront-auth/api.js';
import { checkIsAuthenticated } from '../../scripts/core/auth.js';
import { rootLink } from '../../scripts/core/routes.js';
import { EVENTS, on } from '../../scripts/core/events.js';
import { COOKIES, getCookie } from '../../scripts/core/storage.js';
import { fetchPlaceholders } from '../../scripts/core/i18n.js';
import { logger } from '../../scripts/core/logger.js';

const labels = await fetchPlaceholders();

/** Lookup de placeholder con fallback idéntico al texto original en inglés. */
const t = (key, fallback) => labels?.Global?.[key] ?? fallback;

// TODO: mover estas claves al catálogo central (COOKIES / SESSION_KEYS en
// scripts/core/storage.js) cuando se pueda tocar esa capa; este refactor está
// limitado a blocks/header/.
const ADMIN_SESSION_COOKIE = 'auth_dropin_admin_session';
const LASTNAME_COOKIE = 'auth_dropin_lastname';
const STORE_CONFIG_SESSION_KEY = 'storeConfig';

/**
 * Creates and manages banner for Seller Assisted Buying sessions
 * @returns {Promise<HTMLElement|null>} The banner element or null if not in admin session
 */
export default async function renderSellerAssistedBuyingBanner() {
  if (!checkIsAuthenticated()) {
    return null;
  }

  const isAdminSession = getCookie(ADMIN_SESSION_COOKIE);

  if (!isAdminSession) {
    return null;
  }

  let websiteName = '';
  const authStoreConfig = sessionStorage.getItem(STORE_CONFIG_SESSION_KEY);

  if (authStoreConfig) {
    try {
      websiteName = JSON.parse(authStoreConfig).websiteName ?? '';
    } catch (error) {
      logger.warn('Failed to parse storeConfig from sessionStorage:', error);
      sessionStorage.removeItem(STORE_CONFIG_SESSION_KEY);
    }
  }

  if (!websiteName) {
    try {
      const storeConfig = await authApi.getStoreConfig();
      websiteName = storeConfig?.websiteName ?? '';
      if (storeConfig) {
        sessionStorage.setItem(STORE_CONFIG_SESSION_KEY, JSON.stringify(storeConfig));
      }
    } catch (error) {
      logger.warn('Failed to fetch storeConfig:', error);
    }
  }

  const customerFirstname = getCookie(COOKIES.AUTH_FIRSTNAME) ?? '';
  const customerLastname = getCookie(LASTNAME_COOKIE) ?? '';

  // Create banner element
  const banner = document.createElement('div');
  banner.className = 'seller-assisted-buying-banner';

  // Create message section
  const message = document.createElement('div');
  message.className = 'seller-assisted-buying-banner__message';

  const customerName = document.createElement('strong');
  customerName.textContent = `${customerFirstname} ${customerLastname}`;
  message.append(
    t('SellerBannerConnectedAs', 'You are connected as '),
    customerName,
    t('SellerBannerOnWebsite', ' on {website}').replace('{website}', websiteName),
  );

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'seller-assisted-buying-banner__close-button';
  closeButton.type = 'button';
  const closeButtonTextEl = document.createElement('span');
  closeButtonTextEl.textContent = t('SellerBannerCloseSession', 'Close Session');
  closeButton.appendChild(closeButtonTextEl);

  // Handle close session
  closeButton.addEventListener('click', async () => {
    try {
      // Disable button during logout
      closeButton.disabled = true;
      closeButton.textContent = t('SellerBannerClosing', 'Closing...');

      // Use regular logout mutation, banner will be hidden automatically
      await authApi.revokeCustomerToken();

      // Redirect to home page after logout
      window.location.href = rootLink('/');
    } catch (error) {
      logger.error('Error closing seller assisted buying session:', error);
      closeButton.disabled = false;
      closeButton.textContent = t('SellerBannerCloseSession', 'Close Session');
    }
  });

  banner.appendChild(message);
  banner.appendChild(closeButton);

  // Listen to authentication changes to remove banner if session ends
  on(EVENTS.AUTHENTICATED, (isAuthenticated) => {
    if (!isAuthenticated || !getCookie(ADMIN_SESSION_COOKIE)) {
      banner.remove();
    }
  });

  return banner;
}
