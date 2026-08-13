/**
 * dropins/registry.js — Registro declarativo de capacidades commerce.
 *
 * Capa: dropins (solo puede importar de core y vendor).
 *
 * Responde de un vistazo a "¿qué se inicializa en esta página y por qué?":
 *  - CAPABILITIES.global: dropins montados en TODAS las páginas (fase eager).
 *  - CAPABILITIES.byPageType: dropins montados según el tipo de página.
 *  - El resto se monta bajo demanda desde blocks vía ensureCapability().
 *
 * Añadir un dropin nuevo = crear su initializer en dropins/initializers/ y
 * registrarlo en DEFINITIONS (+ CAPABILITIES si procede).
 */
import { initializers } from '@dropins/tools/initializer.js';
import { isAemAssetsEnabled } from '@dropins/tools/lib/aem/assets.js';
import { getAdobeCommerceOptimizerConfig, getRootPath } from '../core/config.js';
import {
  CORE_FETCH_GRAPHQL,
  setAuthHeaders,
  setCustomerGroupHeader,
  setAdobeCommerceOptimizerHeader,
} from '../core/graphql.js';
import { EVENTS, on, enableEventLogger } from '../core/events.js';
import { getUserTokenCookie } from '../core/auth.js';
import {
  COOKIES, SESSION_KEYS, LOCAL_KEYS, getCookie, clearCookie, setCookie,
} from '../core/storage.js';
import { fetchPlaceholders } from '../core/i18n.js';
import { IS_DEV } from '../core/env.js';
import { PAGE_TYPES } from '../core/lifecycle.js';

/** Carga perezosa de cada initializer (code-splitting por capacidad). */
const DEFINITIONS = {
  auth: () => import('./initializers/auth.js'),
  account: () => import('./initializers/account.js'),
  cart: () => import('./initializers/cart.js'),
  checkout: () => import('./initializers/checkout.js'),
  order: () => import('./initializers/order.js'),
  'payment-services': () => import('./initializers/payment-services.js'),
  pdp: () => import('./initializers/pdp.js'),
  personalization: () => import('./initializers/personalization.js'),
  recommendations: () => import('./initializers/recommendations.js'),
  search: () => import('./initializers/search.js'),
  wishlist: () => import('./initializers/wishlist.js'),
};

/** Mapa declarativo capacidad ↔ página. */
export const CAPABILITIES = Object.freeze({
  /** Montados en todas las páginas durante el arranque. */
  global: ['auth', 'personalization', 'cart'],
  /** Montados automáticamente según el tipo de página detectado. */
  byPageType: {
    [PAGE_TYPES.PRODUCT]: ['pdp'],
  },
});

/** @type {Map<string, Promise<void>>} */
const mounted = new Map();

/**
 * Garantiza que una capacidad (dropin) está inicializada. Idempotente.
 * Es la vía oficial para que un block declare sus dependencias commerce:
 *   await ensureCapability('wishlist');
 * @param {keyof typeof DEFINITIONS} name
 * @returns {Promise<void>}
 */
export async function ensureCapability(name) {
  if (!DEFINITIONS[name]) {
    throw new Error(`Unknown commerce capability: "${name}"`);
  }
  if (!mounted.has(name)) {
    mounted.set(name, DEFINITIONS[name]().then((mod) => mod.default()));
  }
  return mounted.get(name);
}

/**
 * Monta las capacidades asociadas a un tipo de página.
 * @param {string} pageType (ver core/lifecycle.js PAGE_TYPES)
 */
export async function mountPageCapabilities(pageType) {
  const capabilities = CAPABILITIES.byPageType[pageType] || [];
  await Promise.all(capabilities.map(ensureCapability));
}

/**
 * Limpia el estado de carrito al cambiar de website (multi-store) para evitar
 * IDs de carrito y estado de auth obsoletos de otro website.
 */
function clearStaleCartStateOnWebsiteSwitch() {
  const storedWebsitePath = getCookie(COOKIES.WEBSITE_PATH);
  const currentWebsitePath = getRootPath() || '/';
  if (storedWebsitePath && storedWebsitePath !== currentWebsitePath) {
    clearCookie(COOKIES.DROPIN_CART_ID);
    sessionStorage.removeItem(SESSION_KEYS.CART_ID);
    sessionStorage.removeItem(SESSION_KEYS.CART_DATA);
    sessionStorage.removeItem(SESSION_KEYS.CART_SHIPPING);
    localStorage.removeItem(LOCAL_KEYS.CART_AUTHENTICATED);
  }
  setCookie(COOKIES.WEBSITE_PATH, currentWebsitePath);
}

/** Persiste el cart id en sesión para acceso síncrono. */
function persistCartDataInSession(data) {
  if (data?.id) {
    sessionStorage.setItem(SESSION_KEYS.CART_ID, data.id);
  } else {
    sessionStorage.removeItem(SESSION_KEYS.CART_ID);
  }
}

/** Conversión de parámetros de imagen para AEM Assets. */
function setupAemAssetsImageParams() {
  if (isAemAssetsEnabled()) {
    // Convert decimal values to integers for AEM Assets compatibility
    initializers.setImageParamKeys({
      width: (value) => ['width', Math.floor(value)],
      height: (value) => ['height', Math.floor(value)],
      quality: 'quality',
      auto: 'auto',
      crop: 'crop',
      fit: 'fit',
    });
  }
}

/**
 * Arranque global de dropins (fase eager, tras initializeCommerce()).
 * Equivalente refactorizado del antiguo initializers/index.js.
 * @returns {Promise<void>}
 */
export default async function bootGlobalDropins() {
  const init = async () => {
    // Cabecera de grupo de cliente / price book (Catalog Service)
    if (getAdobeCommerceOptimizerConfig()) {
      on(EVENTS.AUTH_ACO, setAdobeCommerceOptimizerHeader, { eager: true });
    } else {
      on(EVENTS.AUTH_GROUP_UID, setCustomerGroupHeader, { eager: true });
    }

    clearStaleCartStateOnWebsiteSwitch();

    // Cabeceras de autenticación
    on(EVENTS.AUTHENTICATED, (state) => {
      setAuthHeaders(state, getUserTokenCookie());
    }, { eager: true });
    setAuthHeaders(!!getUserTokenCookie(), getUserTokenCookie());

    // Cache de cart id en sesión
    on(EVENTS.CART_DATA, persistCartDataInSession, { eager: true });

    // Logger del event bus solo en desarrollo/preview
    enableEventLogger(IS_DEV);

    setupAemAssetsImageParams();

    // Placeholders globales
    await fetchPlaceholders('placeholders/global.json');

    // Dropins globales
    await ensureCapability('auth');
    await ensureCapability('personalization');
    ensureCapability('cart');

    // Recaptcha tras LCP
    on(EVENTS.LCP, async () => {
      await import('@dropins/tools/recaptcha.js').then((mod) => {
        const recaptcha = /** @type {any} */ (mod);
        recaptcha.setEndpoint(CORE_FETCH_GRAPHQL);
        recaptcha.enableLogger(IS_DEV);
        return recaptcha.setConfig();
      });
    });
  };

  // re-initialize on prerendering changes
  document.addEventListener('prerenderingchange', bootGlobalDropins, { once: true });

  return init();
}
