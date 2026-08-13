/**
 * ui/dropin-block.js — Montaje estándar de un block que envuelve un container.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Reduce los ~25 micro-blocks de cuenta/pedido a una llamada declarativa:
 *
 * @example
 * export default async function decorate(block) {
 *   await mountDropinBlock(block, {
 *     capability: 'account',
 *     guard: 'auth',
 *     render: () => accountRenderer.render(Addresses, { ... })(block),
 *   });
 * }
 */
import { ensureCapability } from '../dropins/registry.js';
import { requireAuth, requireGuest } from './guards.js';

/**
 * @param {Element} _block El elemento del block (contrato EDS)
 * @param {object} def
 * @param {string|string[]} [def.capability] Capacidad(es) commerce requeridas
 * @param {'auth'|'guest'} [def.guard] Guard de autenticación a aplicar
 * @param {string} [def.guardRedirect] Ruta de redirección del guard
 * @param {() => unknown|Promise<unknown>} def.render Render del container
 * @returns {Promise<unknown>}
 */
export async function mountDropinBlock(_block, {
  capability, guard, guardRedirect, render,
}) {
  const capabilities = Array.isArray(capability) ? capability : [capability].filter(Boolean);
  await Promise.all(capabilities.map(ensureCapability));

  const guardOptions = guardRedirect ? { redirectTo: guardRedirect } : {};
  if (guard === 'auth') return requireAuth(render, guardOptions);
  if (guard === 'guest') return requireGuest(render, guardOptions);
  return render();
}
