/**
 * core/consent.js — Consentimiento de privacidad (RGPD), agnóstico del CMP.
 *
 * Capa: core (solo puede importar de vendor y core).
 *
 * Arquitectura: patrón provider. Este módulo define el contrato y el estado;
 * el CMP concreto (OneTrust, Didomi, Cookiebot…) se integrará más adelante
 * como un provider en scripts/core/consent-providers/<cmp>.js que se registra
 * con setConsentProvider(). Ver docs/adr/0004-consent-provider.md.
 *
 * ⚠️ Hasta que se integre el CMP, rige el provider por defecto, que es
 * PERMISIVO (devuelve true para todo) para mantener el comportamiento del
 * boilerplate. Esto está señalizado con un warn y debe resolverse antes de
 * salir a producción.
 *
 * Integración futura (3 pasos):
 *   1. Crear scripts/core/consent-providers/<cmp>.js implementando
 *      ConsentProvider contra la API del CMP (mapeo de topics → categorías).
 *   2. Cargar el script del CMP (normalmente en delayed.js o head, según sus
 *      requisitos legales de bloqueo previo).
 *   3. Llamar a setConsentProvider(provider) en cuanto el CMP esté listo.
 * Los consumidores (analítica, historial) ya son reactivos vía
 * whenConsented()/onConsentChange() y no necesitarán cambios.
 */
import { logger } from './logger.js';
import { EVENTS, emit } from './events.js';

/** Topics de consentimiento usados por el proyecto. */
export const CONSENT_TOPICS = Object.freeze({
  /** Analítica de commerce (events SDK/collector, Adobe Data Layer). */
  COMMERCE_COLLECTION: 'commerce-collection',
  /** Historial de navegación/compra para recomendaciones. */
  COMMERCE_RECOMMENDATIONS: 'commerce-recommendations',
});

/**
 * Contrato que debe implementar el provider del CMP.
 * @typedef {object} ConsentProvider
 * @property {(topic: string) => boolean} getConsent
 *   Estado actual de consentimiento para un topic (ver CONSENT_TOPICS).
 * @property {(notify: () => void) => void} [subscribe]
 *   Debe invocar notify() cada vez que el usuario cambie sus preferencias.
 */

/** Provider por defecto: permisivo, con aviso. Sustituir por el CMP real. */
const permissiveDefaultProvider = (() => {
  let warned = false;
  return {
    getConsent(_topic) {
      if (!warned) {
        logger.warn('consent: CMP no integrado; usando provider permisivo por defecto (resolver antes de producción)');
        warned = true;
      }
      return true;
    },
  };
})();

/** @type {ConsentProvider} */
let provider = permissiveDefaultProvider;

/** @type {Set<() => void>} */
const listeners = new Set();

function notifyConsentChanged() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      logger.error('consent: error en listener de cambio de consentimiento', e);
    }
  });
  emit(EVENTS.CONSENT_CHANGED);
}

/**
 * Registra el provider del CMP. Idempotente respecto a los consumidores:
 * dispara una notificación de cambio para que re-evalúen su estado.
 * @param {ConsentProvider} newProvider
 */
export function setConsentProvider(newProvider) {
  provider = newProvider;
  if (typeof newProvider.subscribe === 'function') {
    newProvider.subscribe(notifyConsentChanged);
  }
  notifyConsentChanged();
}

/**
 * Check if consent was given for a specific topic.
 * @param {string} topic Topic identifier (ver CONSENT_TOPICS)
 * @returns {boolean} True if consent was given
 */
export function getConsent(topic) {
  return provider.getConsent(topic);
}

/**
 * Suscripción a cambios de consentimiento.
 * @param {() => void} cb
 * @returns {() => void} función para cancelar la suscripción
 */
export function onConsentChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Ejecuta `cb` en cuanto exista consentimiento para el topic: inmediatamente
 * si ya lo hay, o cuando el usuario lo otorgue. Se ejecuta como máximo una vez.
 * @param {string} topic
 * @param {() => void} cb
 * @returns {() => void} función para cancelar la espera
 */
export function whenConsented(topic, cb) {
  if (getConsent(topic)) {
    cb();
    return () => {};
  }
  const off = onConsentChange(() => {
    if (getConsent(topic)) {
      off();
      cb();
    }
  });
  return off;
}
