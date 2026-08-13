/**
 * Tests de ui/slots/product-link.js — unificación de las formas de item que
 * devuelven los distintos dropins.
 */
vi.mock('../../../scripts/core/routes.js', () => ({
  getProductLink: vi.fn((urlKey, sku) => `/products/${urlKey}/${sku}`),
  rootLink: vi.fn((link) => link),
}));

const { productLinkFromItem } = await import('../../../scripts/ui/slots/product-link.js');

describe('ui/slots/product-link', () => {
  it('acepta la forma de cart item ({ url.urlKey, topLevelSku })', () => {
    const item = { url: { urlKey: 'zapatilla' }, topLevelSku: 'ZAP-1' };
    expect(productLinkFromItem(item)).toBe('/products/zapatilla/ZAP-1');
  });

  it('acepta la forma plana ({ urlKey, sku })', () => {
    const item = { urlKey: 'raqueta', sku: 'RAQ-9' };
    expect(productLinkFromItem(item)).toBe('/products/raqueta/RAQ-9');
  });

  it('prioriza topLevelSku sobre sku (productos configurables)', () => {
    const item = { urlKey: 'camiseta', sku: 'CAM-1-M-ROJO', topLevelSku: 'CAM-1' };
    expect(productLinkFromItem(item)).toBe('/products/camiseta/CAM-1');
  });

  it('devuelve "#" localizado si faltan datos (producto borrado del catálogo)', () => {
    expect(productLinkFromItem({})).toBe('#');
    expect(productLinkFromItem(null)).toBe('#');
    expect(productLinkFromItem({ urlKey: 'solo-key' })).toBe('#');
  });
});
