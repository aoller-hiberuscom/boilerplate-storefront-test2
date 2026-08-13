/**
 * dropins/create-initializer.js — Factory de initializers de dropins.
 *
 * Capa: dropins (solo puede importar de core y vendor).
 *
 * Elimina el boilerplate repetido del boilerplate de Adobe (endpoint +
 * placeholders + langDefinitions + mountImmediately, copiado en 10 ficheros)
 * y sustituye el arranque por side-effect de import: cada initializer exporta
 * una función `init` que ejecuta el registro (scripts/dropins/registry.js).
 */
import { initializers } from '@dropins/tools/initializer.js';
import { fetchPlaceholders } from '../core/i18n.js';
import { CORE_FETCH_GRAPHQL, CS_FETCH_GRAPHQL } from '../core/graphql.js';

const ENDPOINTS = {
  core: CORE_FETCH_GRAPHQL,
  catalogService: CS_FETCH_GRAPHQL,
};

/**
 * Envuelve un callback de inicialización con idempotencia y re-inicialización
 * en `prerenderingchange` (necesario por las speculation rules de head.html).
 * @param {() => Promise<unknown>} cb
 * @returns {(force?: boolean) => Promise<void>} función init idempotente
 */
export function initializeDropin(cb) {
  let initialized = false;

  const init = async (force = false) => {
    // prevent re-initialization
    if (initialized && !force) return;
    initialized = true;
    await cb();
  };

  // re-initialize on prerendering changes
  document.addEventListener('prerenderingchange', () => init(true), { once: true });

  return init;
}

/**
 * @typedef {object} DropinInitializerDef
 * @property {{ initialize: any, setEndpoint?: (endpoint: any) => void }} api
 *   API del dropin (import * as api from '@dropins/storefront-x/api.js').
 * @property {'core'|'catalogService'} [endpoint]
 *   Cliente GraphQL a conectar vía api.setEndpoint().
 * @property {string} [placeholders]
 *   Hoja de placeholders, p.ej. 'placeholders/cart.json'.
 * @property {(ctx: { labels: object, langDefinitions: object }) => object} [getProps]
 *   Props extra para initializers.mountImmediately.
 * @property {(ctx: { labels: object, langDefinitions: object }) => Promise<unknown>} [mount]
 *   Montaje totalmente personalizado (sustituye al mountImmediately por defecto).
 */

/**
 * Crea el initializer declarativo de un dropin.
 * @param {DropinInitializerDef} def
 * @returns {(force?: boolean) => Promise<void>}
 */
export function createDropinInitializer(def) {
  return initializeDropin(async () => {
    const {
      api, endpoint, placeholders, getProps, mount,
    } = def;

    // Conecta el cliente GraphQL correspondiente
    if (endpoint && api.setEndpoint) {
      api.setEndpoint(ENDPOINTS[endpoint]);
    }

    // Placeholders → langDefinitions
    const labels = placeholders ? await fetchPlaceholders(placeholders) : {};
    const langDefinitions = { default: { ...labels } };
    const ctx = { labels, langDefinitions };

    // Montaje personalizado
    if (mount) {
      await mount(ctx);
      return;
    }

    // Montaje estándar
    const props = getProps ? await getProps(ctx) : {};
    await initializers.mountImmediately(api.initialize, { langDefinitions, ...props });
  });
}
