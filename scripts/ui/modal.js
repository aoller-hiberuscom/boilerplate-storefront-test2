/**
 * ui/modal.js — Servicio de modales.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 * Envuelve blocks/modal (carga perezosa) y la auto-vinculación de enlaces
 * `/modals/*`.
 */

/**
 * Abre como modal el contenido de una ruta de fragmento.
 * @param {string} href Ruta a un fragmento bajo /modals/
 */
export async function openModal(href) {
  const { openModal: open } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
  return open(href);
}

/**
 * Automatically links modal functionality to `/modals/*` anchors.
 * @param {Element|Document} element - The element to attach modal functionality to
 */
export function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target instanceof Element ? e.target.closest('a') : null;

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      await openModal(origin.href);
    }
  });
}
