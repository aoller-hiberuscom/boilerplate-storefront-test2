/**
 * Tests de core/events.js — catálogo y wrapper del event bus de dropins.
 * El bus es un singleton global: cada test usa nombres de evento únicos.
 */
import {
  EVENTS, on, emit, lastPayload,
} from '../../../scripts/core/events.js';

describe('core/events', () => {
  it('el catálogo contiene los eventos clave con sus nombres canónicos', () => {
    expect(EVENTS.LCP).toBe('aem/lcp');
    expect(EVENTS.AUTHENTICATED).toBe('authenticated');
    expect(EVENTS.CART_DATA).toBe('cart/data');
    expect(EVENTS.CHECKOUT_ADDRESSES_SHIPPING).toBe('checkout/addresses/shipping');
    expect(EVENTS.CONSENT_CHANGED).toBe('se/consent-changed');
    expect(Object.isFrozen(EVENTS)).toBe(true);
  });

  it('on/emit entregan el payload a los suscriptores (entrega asíncrona)', async () => {
    // El bus de dropins usa BroadcastChannel: la entrega es asíncrona
    const handler = vi.fn();
    on('se/test-roundtrip', handler);
    emit('se/test-roundtrip', { value: 42 });
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('lastPayload devuelve el último payload emitido', () => {
    emit('se/test-last-payload', 'first');
    emit('se/test-last-payload', 'second');
    expect(lastPayload('se/test-last-payload')).toBe('second');
  });

  it('on con eager entrega el último payload a suscriptores tardíos', () => {
    emit('se/test-eager', 'already-emitted');
    const late = vi.fn();
    on('se/test-eager', late, { eager: true });
    expect(late).toHaveBeenCalledWith('already-emitted');
  });
});
