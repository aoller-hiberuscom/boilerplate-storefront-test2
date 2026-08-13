/**
 * domain/analytics.js — Adobe Client Data Layer (ACDL) e historial.
 *
 * Capa: domain (solo puede importar de core y vendor).
 *
 * Único módulo autorizado a interactuar con window.adobeDataLayer desde el
 * código propio. Los blocks NUNCA tocan el data layer directamente.
 */
import { getStoreViewCode } from '../core/config.js';
import { getConsent, whenConsented, CONSENT_TOPICS } from '../core/consent.js';
import { LOCAL_KEYS } from '../core/storage.js';

/**
 * Initializes Adobe Data Layer for commerce.
 * @param {string} pageType - The detected page type
 */
export function initializeAdobeDataLayer(pageType) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push(
    {
      pageContext: {
        pageType,
        pageName: document.title,
        eventType: 'visibilityHidden',
        maxXOffset: 0,
        maxYOffset: 0,
        minXOffset: 0,
        minYOffset: 0,
      },
    },
    {
      shoppingCartContext: {
        totalQuantity: 0,
      },
    },
  );
  window.adobeDataLayer.push((dl) => {
    dl.push({ event: 'page-view', eventInfo: { ...dl.getState() } });
  });
}

/**
 * Tracks user browsing and purchase history for recommendations.
 * Stores product view history and purchase history in localStorage,
 * gated by user consent (starts as soon as consent is granted; each write
 * re-checks consent to honour revocation).
 */
export function trackHistory() {
  whenConsented(CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS, startHistoryTracking);
}

function startHistoryTracking() {
  const storeViewCode = getStoreViewCode();
  const MAX_VIEW_HISTORY = 20;
  const MAX_PURCHASE_HISTORY = 5;

  window.adobeDataLayer.push((dl) => {
    dl.addEventListener('adobeDataLayer:change', (event) => {
      if (!getConsent(CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS)) {
        return;
      }
      if (!event.productContext || !event.productContext.sku) {
        return;
      }
      const key = `${storeViewCode}:${LOCAL_KEYS.PRODUCT_VIEW_HISTORY}`;
      let viewHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      viewHistory = viewHistory.filter((item) => item.sku !== event.productContext.sku);
      viewHistory.push({ date: new Date().toISOString(), sku: event.productContext.sku });
      const trimmed = viewHistory.slice(-MAX_VIEW_HISTORY);
      window.localStorage.setItem(key, JSON.stringify(trimmed));
    }, { path: 'productContext' });
    dl.addEventListener('place-order', () => {
      if (!getConsent(CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS)) {
        return;
      }
      const shoppingCartContext = dl.getState('shoppingCartContext');
      if (!shoppingCartContext) {
        return;
      }
      const key = `${storeViewCode}:${LOCAL_KEYS.PURCHASE_HISTORY}`;
      const purchasedProducts = shoppingCartContext.items.map((item) => item.product.sku);
      const purchaseHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      purchaseHistory.push({ date: new Date().toISOString(), items: purchasedProducts });
      const trimmed = purchaseHistory.slice(-MAX_PURCHASE_HISTORY);
      window.localStorage.setItem(key, JSON.stringify(trimmed));
    });
  });
}
