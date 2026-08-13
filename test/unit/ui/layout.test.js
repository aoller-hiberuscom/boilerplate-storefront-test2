/**
 * Tests de ui/layout.js — scaffold con refs declarativas (data-ref).
 */
import { createLayout } from '../../../scripts/ui/layout.js';

describe('ui/layout', () => {
  it('devuelve el fragment y las refs de los nodos marcados', () => {
    const { root, refs } = createLayout(`
      <div class="checkout">
        <div class="checkout__main" data-ref="main"></div>
        <aside class="checkout__aside" data-ref="aside"></aside>
      </div>
    `);

    expect(root).toBeInstanceOf(DocumentFragment);
    expect(refs.main.className).toBe('checkout__main');
    expect(refs.aside.tagName).toBe('ASIDE');
  });

  it('las refs siguen siendo válidas tras insertar el fragment en el DOM', () => {
    const { root, refs } = createLayout('<div><span data-ref="x">hola</span></div>');
    const host = document.createElement('div');
    host.appendChild(root);

    expect(host.contains(refs.x)).toBe(true);
    expect(refs.x.textContent).toBe('hola');
  });

  it('sin data-ref devuelve un mapa vacío', () => {
    const { refs } = createLayout('<div><p>nada</p></div>');
    expect(Object.keys(refs)).toHaveLength(0);
  });
});
