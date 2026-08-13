/**
 * commerce.js — FACHADA DE COMPATIBILIDAD (deprecada).
 *
 * El antiguo god-module fue descompuesto en capas (ver docs/ARQUITECTURA-FRONTEND.md):
 *   - scripts/core/    → config, graphql, events, routes, storage, i18n, auth, consent…
 *   - scripts/domain/  → analytics, product, seo
 *   - scripts/dropins/ → registro declarativo de capacidades commerce
 *   - scripts/ui/      → guards, slots, layout, modal
 *
 * Este fichero solo re-exporta desde las nuevas ubicaciones para no romper
 * los blocks aún no migrados. NO añadir código nuevo aquí: importar
 * directamente del módulo de la capa correspondiente. Se eliminará cuando
 * todos los blocks estén migrados (fase 3).
 */
import { initializeCommerce as initCommercePlatform, detectPageType, notifyUI } from './core/lifecycle.js';
import { catalogServiceEndpointWithQueryParams } from './core/graphql.js';
import { initializeAdobeDataLayer, trackHistory } from './domain/analytics.js';
import bootGlobalDropins, { mountPageCapabilities } from './dropins/registry.js';
import { autolinkModals } from './ui/modal.js';

// core/env
export { IS_UE, IS_DA } from './core/env.js';

// core/graphql
export {
  CORE_FETCH_GRAPHQL,
  CS_FETCH_GRAPHQL,
} from './core/graphql.js';

// core/routes
export {
  SUPPORT_PATH,
  PRIVACY_POLICY_PATH,
  ORDER_STATUS_PATH,
  ORDER_DETAILS_PATH,
  RETURN_DETAILS_PATH,
  CREATE_RETURN_PATH,
  SALES_GUEST_VIEW_PATH,
  CUSTOMER_PATH,
  CUSTOMER_ORDER_DETAILS_PATH,
  CUSTOMER_RETURN_DETAILS_PATH,
  CUSTOMER_CREATE_RETURN_PATH,
  CUSTOMER_ORDERS_PATH,
  CUSTOMER_RETURNS_PATH,
  CUSTOMER_ADDRESS_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  SALES_ORDER_VIEW_PATH,
  UPS_TRACKING_URL,
  rootLink,
  getProductLink,
  decorateLinks,
} from './core/routes.js';

// core/config
export { getConfigFromSession } from './core/config.js';

// core/i18n
export { fetchPlaceholders } from './core/i18n.js';

// core/content
export { fetchIndex, preloadFile } from './core/content.js';

// core/auth
export { checkIsAuthenticated } from './core/auth.js';

// core/consent
export { getConsent } from './core/consent.js';

// core/error
export { loadErrorPage } from './core/error.js';

// core/decoration
export { decorateSections, applyTemplates } from './core/decoration.js';

// domain/product
export {
  PRODUCT_TEMPLATE_PATHS,
  isProductTemplate,
  getProductSku,
  getOptionsUIDsFromUrl,
} from './domain/product.js';

// domain/seo
export { setJsonLd } from './domain/seo.js';

// ui/slots
export { authPrivacyPolicyConsentSlot } from './ui/slots/privacy-policy-consent.js';

/* ------------------------------------------------------------------ */
/* Wrappers de compatibilidad                                          */
/* ------------------------------------------------------------------ */

/**
 * @deprecated Usar core/lifecycle.js + dropins/registry.js.
 * Mantiene el comportamiento original: config + GraphQL + dropins globales.
 */
export async function initializeCommerce() {
  await initCommercePlatform();
  return bootGlobalDropins();
}

/** @deprecated Orquestación movida a scripts.js. */
export async function loadCommerceEager() {
  const pageType = detectPageType();
  initializeAdobeDataLayer(pageType);
  await mountPageCapabilities(pageType);
  notifyUI('lcp');
}

/** @deprecated Orquestación movida a scripts.js. */
export async function loadCommerceLazy() {
  autolinkModals(document);
  await import('./acdl/adobe-client-data-layer.min.js');
  trackHistory();
}

/** @deprecated Usar catalogServiceEndpointWithQueryParams (core/graphql.js). */
export async function commerceEndpointWithQueryParams() {
  return catalogServiceEndpointWithQueryParams();
}
