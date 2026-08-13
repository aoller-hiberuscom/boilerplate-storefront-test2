/**
 * Tests de blocks/commerce-checkout/sections/addresses.js — lógica de modo
 * (guest / customer / carrito virtual) y asimetrías shipping/billing.
 * Los dropins se mockean; se verifica QUÉ se monta, DÓNDE y con QUÉ props.
 */
// El export `render` de los dropins es un provider (objeto con .render)
vi.mock('@dropins/storefront-account/render.js', () => ({
  render: { render: vi.fn(() => vi.fn(async () => ({ remove: vi.fn() }))) },
}));
vi.mock('@dropins/storefront-checkout/render.js', () => ({
  render: { render: vi.fn(() => vi.fn(async () => ({ remove: vi.fn() }))) },
}));
vi.mock('@dropins/storefront-account/containers/Addresses.js', () => ({ default: 'Addresses' }));
vi.mock('@dropins/storefront-account/containers/AddressForm.js', () => ({ default: 'AddressForm' }));
vi.mock('@dropins/storefront-checkout/containers/BillToShippingAddress.js', () => ({ default: 'BillToShippingAddress' }));
vi.mock('@dropins/storefront-checkout/api.js', () => ({
  getStoreConfigCache: vi.fn(() => ({ defaultCountry: 'ES' })),
}));
vi.mock('@dropins/storefront-checkout/lib/utils.js', () => ({
  isVirtualCart: vi.fn(() => false),
  getCartAddress: vi.fn(() => null),
  setAddressOnCart: vi.fn(() => vi.fn()),
  estimateShippingCost: vi.fn(() => vi.fn()),
  transformCartAddressToFormValues: vi.fn((address) => address),
}));
vi.mock('@dropins/tools/lib.js', () => ({
  debounce: vi.fn((fn) => fn),
}));
vi.mock('../../../scripts/core/i18n.js', () => ({
  fetchPlaceholders: vi.fn(async () => ({})),
}));

const accountProvider = (await import('@dropins/storefront-account/render.js')).render;
const accountRender = accountProvider.render;
const { isVirtualCart } = await import('@dropins/storefront-checkout/lib/utils.js');
const { createAddressesSection } = await import(
  '../../../blocks/commerce-checkout/sections/addresses.js'
);

/** Crea refs mínimas del layout del checkout. */
const createRefs = () => ({
  shippingForm: document.createElement('div'),
  billingForm: document.createElement('div'),
  billToShipping: document.createElement('div'),
});

/** Props del último render de Addresses/AddressForm sobre un contenedor. */
const propsOfRenderInto = (container) => {
  const call = accountRender.mock.calls.find((c, i) => (
    accountRender.mock.results[i]
    && accountRender.mock.results[i].value.mock.calls.some(([target]) => target === container)
  ));
  return call?.[1];
};

describe('sections/addresses', () => {
  beforeEach(() => {
    accountRender.mockClear();
    isVirtualCart.mockReturnValue(false);
  });

  it('guest: monta formularios de shipping y billing con sus form names', async () => {
    const refs = createRefs();
    const section = createAddressesSection(refs);
    await section.displayGuestAddressForms({ isGuest: true });

    const shippingProps = propsOfRenderInto(refs.shippingForm);
    const billingProps = propsOfRenderInto(refs.billingForm);

    expect(shippingProps.formName).toBe('selectedShippingAddress');
    expect(shippingProps.fieldIdPrefix).toBe('shipping');
    expect(billingProps.formName).toBe('selectedBillingAddress');
    expect(billingProps.fieldIdPrefix).toBe('billing');
  });

  it('guest: no re-monta los formularios en llamadas sucesivas', async () => {
    const section = createAddressesSection(createRefs());
    await section.displayGuestAddressForms({});
    const rendersAfterFirst = accountRender.mock.calls.length;

    await section.displayGuestAddressForms({});
    expect(accountRender.mock.calls.length).toBe(rendersAfterFirst);
  });

  it('carrito virtual: no monta shipping pero sí billing', async () => {
    isVirtualCart.mockReturnValue(true);
    const refs = createRefs();
    const section = createAddressesSection(refs);
    await section.displayGuestAddressForms({});

    expect(propsOfRenderInto(refs.shippingForm)).toBeUndefined();
    expect(propsOfRenderInto(refs.billingForm)).toBeDefined();
    expect(refs.shippingForm.innerHTML).toBe('');
  });

  it('customer: mantiene las asimetrías del original (selectShipping/selectBilling)', async () => {
    const refs = createRefs();
    const section = createAddressesSection(refs);
    await section.displayCustomerAddressForms({});

    const shippingProps = propsOfRenderInto(refs.shippingForm);
    const billingProps = propsOfRenderInto(refs.billingForm);

    expect(shippingProps.selectShipping).toBe(true);
    expect(shippingProps.fieldIdPrefix).toBe('shipping');
    expect(shippingProps.selectBilling).toBeUndefined();

    expect(billingProps.selectBilling).toBe(true);
    expect(billingProps.selectShipping).toBeUndefined();
    // El original NO define fieldIdPrefix en billing de customer
    expect('fieldIdPrefix' in billingProps).toBe(false);
  });

  it('customer tras guest: desmonta el formulario guest y resetea el formRef', async () => {
    const refs = createRefs();
    const section = createAddressesSection(refs);

    await section.displayGuestAddressForms({});
    section.shippingFormRef.current = 'guest-form';

    await section.displayCustomerAddressForms({});
    expect(section.shippingFormRef.current).toBeNull();
  });

  it('setBillingVisibility alterna la visibilidad del contenedor de billing', () => {
    const refs = createRefs();
    const section = createAddressesSection(refs);

    section.setBillingVisibility(true);
    expect(refs.billingForm.style.display).toBe('none');

    section.setBillingVisibility(false);
    expect(refs.billingForm.style.display).toBe('block');
  });
});
