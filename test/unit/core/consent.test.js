/**
 * Tests de core/consent.js — patrón provider CMP-agnóstico.
 * Se recarga el módulo en cada test para aislar su estado interno.
 */

const loadConsent = async () => {
  vi.resetModules();
  return import('../../../scripts/core/consent.js');
};

describe('core/consent', () => {
  it('el provider por defecto es permisivo (devuelve true)', async () => {
    const { getConsent, CONSENT_TOPICS } = await loadConsent();
    expect(getConsent(CONSENT_TOPICS.COMMERCE_COLLECTION)).toBe(true);
    expect(getConsent(CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS)).toBe(true);
  });

  it('setConsentProvider sustituye la fuente de verdad', async () => {
    const { getConsent, setConsentProvider, CONSENT_TOPICS } = await loadConsent();
    setConsentProvider({ getConsent: (topic) => topic === CONSENT_TOPICS.COMMERCE_COLLECTION });

    expect(getConsent(CONSENT_TOPICS.COMMERCE_COLLECTION)).toBe(true);
    expect(getConsent(CONSENT_TOPICS.COMMERCE_RECOMMENDATIONS)).toBe(false);
  });

  it('whenConsented ejecuta inmediatamente si ya hay consentimiento', async () => {
    const { whenConsented, CONSENT_TOPICS } = await loadConsent();
    const cb = vi.fn();
    whenConsented(CONSENT_TOPICS.COMMERCE_COLLECTION, cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('whenConsented espera al otorgamiento y ejecuta una sola vez', async () => {
    const { whenConsented, setConsentProvider } = await loadConsent();

    let granted = false;
    let notifyChange;
    setConsentProvider({
      getConsent: () => granted,
      subscribe: (notify) => { notifyChange = notify; },
    });

    const cb = vi.fn();
    whenConsented('any-topic', cb);
    expect(cb).not.toHaveBeenCalled();

    // El usuario otorga consentimiento → el CMP notifica
    granted = true;
    notifyChange();
    expect(cb).toHaveBeenCalledTimes(1);

    // Notificaciones posteriores no re-ejecutan el callback
    notifyChange();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onConsentChange permite darse de baja', async () => {
    const { onConsentChange, setConsentProvider } = await loadConsent();

    let notifyChange;
    const listener = vi.fn();
    const off = onConsentChange(listener);
    setConsentProvider({
      getConsent: () => true,
      subscribe: (notify) => { notifyChange = notify; },
    });
    // setConsentProvider ya dispara una notificación
    expect(listener).toHaveBeenCalledTimes(1);

    off();
    notifyChange();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('un listener que lanza no rompe al resto', async () => {
    const { onConsentChange, setConsentProvider } = await loadConsent();

    const bad = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();
    onConsentChange(bad);
    onConsentChange(good);

    setConsentProvider({ getConsent: () => true });
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });
});
