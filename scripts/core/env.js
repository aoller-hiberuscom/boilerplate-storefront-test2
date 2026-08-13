/**
 * core/env.js — Detección de entorno de ejecución.
 *
 * Capa: core (solo puede importar de vendor).
 * Módulo sin side effects: exporta valores derivados de window.location.
 */

/** @type {boolean} True si la página se está editando en el Universal Editor. */
export const IS_UE = window.location.hostname.includes('ue.da.live');

/** @type {boolean} True si la página se está previsualizando en Document Authoring. */
export const IS_DA = new URL(window.location.href).searchParams.has('dapreview');

/** @type {boolean} True en entornos de desarrollo/preview (localhost o *.aem.page). */
export const IS_DEV = window.location.hostname === 'localhost'
  || window.location.hostname.endsWith('.aem.page');
