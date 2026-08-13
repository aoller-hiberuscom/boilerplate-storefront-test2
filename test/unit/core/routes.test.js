/**
 * Tests de core/routes.js — rutas y URLs multi-store.
 * Se mockea core/config.js para controlar el root path del store.
 */
vi.mock('../../../scripts/core/config.js', () => ({
  getRootPath: vi.fn(() => '/es/'),
  getListOfRootPaths: vi.fn(() => ['/es/', '/fr/']),
}));

const {
  sanitizeName, rootLink, getProductLink, decorateLinks, CUSTOMER_ORDER_DETAILS_PATH,
} = await import('../../../scripts/core/routes.js');

describe('core/routes', () => {
  it('sanitizeName normaliza unicode, espacios y mayúsculas', () => {
    expect(sanitizeName('Zapatilla Ñandú Pádel 2.0')).toBe('zapatilla-nandu-padel-2-0');
    expect(sanitizeName('--Ya--Limpio--')).toBe('ya-limpio');
  });

  it('rootLink antepone el root path del store', () => {
    expect(rootLink('/cart')).toBe('/es/cart');
  });

  it('rootLink no re-localiza enlaces ya localizados', () => {
    expect(rootLink('/es/cart')).toBe('/es/cart');
  });

  it('las rutas derivadas se componen del prefijo customer', () => {
    expect(CUSTOMER_ORDER_DETAILS_PATH).toBe('/customer/order-details');
  });

  it('getProductLink construye la URL canónica saneada', () => {
    expect(getProductLink('Camiseta Técnica', 'SKU 123')).toBe('/es/products/camiseta-tecnica/sku-123');
  });

  it('decorateLinks localiza enlaces internos al store actual', () => {
    const main = document.createElement('main');
    main.innerHTML = '<a href="/products/x">p</a>';
    decorateLinks(main);
    expect(new URL(main.querySelector('a').href).pathname).toBe('/es/products/x');
  });

  it('decorateLinks respeta enlaces de otros stores y el flag #nolocal', () => {
    const main = document.createElement('main');
    main.innerHTML = '<a href="/fr/products/x">fr</a><a href="/legal#nolocal">nl</a>';
    decorateLinks(main);
    const [fr, nolocal] = main.querySelectorAll('a');
    expect(new URL(fr.href).pathname).toBe('/fr/products/x');
    expect(new URL(nolocal.href).pathname).toBe('/legal');
    expect(new URL(nolocal.href).hash).toBe('');
  });
});
