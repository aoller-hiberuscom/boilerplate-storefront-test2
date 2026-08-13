/**
 * ui/layout.js — Scaffold de layout con referencias declarativas.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Sustituye el patrón repetido "createContextualFragment + N querySelector"
 * por una única fuente de verdad: el template HTML con atributos data-ref.
 *
 * @example
 * const { root, refs } = createLayout(`
 *   <div class="cart">
 *     <div class="cart__list" data-ref="list"></div>
 *     <div class="cart__summary" data-ref="summary"></div>
 *   </div>
 * `);
 * block.appendChild(root);
 * provider.render(CartSummaryList, {...})(refs.list);
 */

/**
 * @param {string} html Template HTML con atributos data-ref en los nodos a referenciar
 * @returns {{ root: DocumentFragment, refs: Record<string, HTMLElement> }}
 */
export function createLayout(html) {
  const root = document.createRange().createContextualFragment(html);
  const refs = /** @type {Record<string, HTMLElement>} */ (Object.fromEntries(
    [...root.querySelectorAll('[data-ref]')].map((el) => [el.getAttribute('data-ref'), el]),
  ));
  return { root, refs };
}
