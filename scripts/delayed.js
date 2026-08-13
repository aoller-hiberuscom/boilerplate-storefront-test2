/**
 * delayed.js — Fase delayed: analítica (Commerce events SDK + collector).
 */
import { getAnalyticsConfig } from './core/config.js';
import { whenConsented, CONSENT_TOPICS } from './core/consent.js';
import { getUserTokenCookie } from './core/auth.js';
import { logger } from './core/logger.js';

function initAnalytics() {
  // Load Commerce events SDK and collector only if "analytics" has been
  // added to the config, and only once the user has consented (immediately
  // with the default permissive provider; on grant once a CMP is wired in).
  const analyticsConfig = getAnalyticsConfig();
  if (!analyticsConfig) return;

  whenConsented(CONSENT_TOPICS.COMMERCE_COLLECTION, () => startAnalytics(analyticsConfig));
}

function startAnalytics(analyticsConfig) {
  try {
    window.adobeDataLayer.push(
      {
        storefrontInstanceContext: {
          baseCurrencyCode: analyticsConfig['base-currency-code'],
          environment: analyticsConfig.environment,
          environmentId: analyticsConfig['environment-id'],
          storeCode: analyticsConfig['store-code'],
          storefrontTemplate: 'EDS',
          storeId: parseInt(analyticsConfig['store-id'], 10),
          storeName: analyticsConfig['store-name'],
          storeUrl: analyticsConfig['store-url'],
          storeViewCode: analyticsConfig['store-view-code'],
          storeViewCurrencyCode: analyticsConfig['base-currency-code'],
          storeViewId: parseInt(analyticsConfig['store-view-id'], 10),
          storeViewName: analyticsConfig['store-view-name'],
          websiteCode: analyticsConfig['website-code'],
          websiteId: parseInt(analyticsConfig['website-id'], 10),
          websiteName: analyticsConfig['website-name'],
          viewId: analyticsConfig['view-id'], // applicable for ACO storefronts
          // setting locale if defined, applicable for ACO storefronts
          ...(analyticsConfig.locale && { locale: analyticsConfig.locale }),
        },
      },
      {
        eventForwardingContext: {
          commerce: true,
          aep: !!(analyticsConfig['aep-ims-org-id'] && analyticsConfig['aep-datastream-id']),
        },
      },
      {
        shopperContext: {
          shopperId: getUserTokenCookie() ? 'logged-in' : 'guest',
        },
      },
      {
        aepContext: {
          imsOrgId: analyticsConfig['aep-ims-org-id'],
          datastreamId: analyticsConfig['aep-datastream-id'],
        },
      },
    );

    // Load events SDK and collector
    import('./commerce-events-sdk.js');
    import('./commerce-events-collector.js');
  } catch (error) {
    logger.warn('Error initializing analytics', error);
  }
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', initAnalytics, { once: true });
} else {
  initAnalytics();
}

// add delayed functionality here
