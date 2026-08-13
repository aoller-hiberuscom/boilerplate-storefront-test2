/**
 * Tests de core/i18n.js — placeholders (fetch, merge, estructura anidada,
 * deduplicación) y locale de página.
 */
vi.mock('../../../scripts/core/config.js', () => ({
  getRootPath: vi.fn(() => '/'),
  getConfigValue: vi.fn(() => undefined),
}));

vi.mock('../../../scripts/aem.js', () => ({
  getMetadata: vi.fn(() => ''),
}));

const sheet = (rows) => ({
  ok: true,
  json: async () => ({ data: rows }),
});

describe('core/i18n', () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.placeholders;
  });

  it('fetchPlaceholders convierte claves punteadas en estructura anidada', async () => {
    const fetchMock = vi.fn(async () => sheet([
      { Key: 'Checkout.Summary.heading', Value: 'Resumen ({count})' },
      { Key: 'Global.Error', Value: 'Error' },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const { fetchPlaceholders } = await import('../../../scripts/core/i18n.js');
    const labels = await fetchPlaceholders('placeholders/checkout.json');

    expect(labels.Checkout.Summary.heading).toBe('Resumen ({count})');
    expect(labels.Global.Error).toBe('Error');
    expect(fetchMock).toHaveBeenCalledWith(
      '/placeholders/checkout.json?sheet=data',
      { cache: 'force-cache' },
    );
  });

  it('deduplica peticiones concurrentes de la misma hoja', async () => {
    const fetchMock = vi.fn(async () => sheet([{ Key: 'a', Value: '1' }]));
    vi.stubGlobal('fetch', fetchMock);

    const { fetchPlaceholders } = await import('../../../scripts/core/i18n.js');
    await Promise.all([
      fetchPlaceholders('placeholders/x.json'),
      fetchPlaceholders('placeholders/x.json'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sin path devuelve el objeto fusionado acumulado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sheet([{ Key: 'k', Value: 'v' }])));

    const { fetchPlaceholders } = await import('../../../scripts/core/i18n.js');
    await fetchPlaceholders('placeholders/x.json');
    const merged = await fetchPlaceholders();

    expect(merged.k).toBe('v');
  });

  it('una hoja inexistente resuelve a objeto vacío sin lanzar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found' })));

    const { fetchPlaceholders } = await import('../../../scripts/core/i18n.js');
    await expect(fetchPlaceholders('placeholders/missing.json')).resolves.toEqual({});
  });

  it('getPageLocale prioriza metadata, luego config, luego el atributo actual', async () => {
    const { getMetadata } = await import('../../../scripts/aem.js');
    const { getConfigValue } = await import('../../../scripts/core/config.js');
    const { getPageLocale } = await import('../../../scripts/core/i18n.js');

    getMetadata.mockReturnValue('es-ES');
    expect(getPageLocale()).toBe('es-ES');

    getMetadata.mockReturnValue('');
    getConfigValue.mockReturnValue('es');
    expect(getPageLocale()).toBe('es');

    getConfigValue.mockReturnValue(undefined);
    document.documentElement.lang = 'fr';
    expect(getPageLocale()).toBe('fr');
  });
});
