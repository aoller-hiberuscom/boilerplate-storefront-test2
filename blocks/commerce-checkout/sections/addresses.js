/**
 * sections/addresses.js — Direcciones del checkout (shipping y billing).
 *
 * Unifica las dos variantes del boilerplate que estaban duplicadas al ~90%
 * (renderCustomerShippingAddresses / renderCustomerBillingAddresses) en una
 * única implementación parametrizada por addressType, manteniendo las props
 * finales de cada tipo byte a byte (incluidas las asimetrías del original:
 * billing sin fieldIdPrefix, addressFormTitle billToNewAddress, etc.).
 *
 * La sección es dueña del estado de modo (guest/customer/virtual), de los
 * formRefs y de los skeletons; el orquestador solo le pasa los datos del
 * evento checkout/initialized|updated.
 */
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import BillToShippingAddress from '@dropins/storefront-checkout/containers/BillToShippingAddress.js';
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import Addresses from '@dropins/storefront-account/containers/Addresses.js';
import AddressForm from '@dropins/storefront-account/containers/AddressForm.js';
import { render as AccountProvider } from '@dropins/storefront-account/render.js';
import { debounce } from '@dropins/tools/lib.js';
import {
  estimateShippingCost,
  setAddressOnCart,
  getCartAddress,
  transformCartAddressToFormValues,
  isVirtualCart,
} from '@dropins/storefront-checkout/lib/utils.js';
import { EVENTS, emit, lastPayload } from '../../../scripts/core/events.js';
import { fetchPlaceholders } from '../../../scripts/core/i18n.js';
import {
  ADDRESS_INPUT_DEBOUNCE_TIME,
  BILLING_ADDRESS_DATA_KEY,
  BILLING_FORM_NAME,
  DEBOUNCE_TIME,
  SHIPPING_ADDRESS_DATA_KEY,
  SHIPPING_FORM_NAME,
} from '../constants.js';

/** Config por tipo de dirección (mantiene las asimetrías del original). */
const perType = (isShipping, placeholders) => ({
  formName: isShipping ? SHIPPING_FORM_NAME : BILLING_FORM_NAME,
  dataKey: isShipping ? SHIPPING_ADDRESS_DATA_KEY : BILLING_ADDRESS_DATA_KEY,
  addressesEvent: isShipping
    ? EVENTS.CHECKOUT_ADDRESSES_SHIPPING
    : EVENTS.CHECKOUT_ADDRESSES_BILLING,
  customerFormTitle: isShipping
    ? placeholders?.Checkout?.Addresses?.shippingAddressTitle
    : placeholders?.Checkout?.Addresses?.billToNewAddress,
  title: isShipping
    ? placeholders?.Checkout?.Addresses?.shippingAddressTitle
    : placeholders?.Checkout?.Addresses?.billingAddressTitle,
  guestClassName: isShipping
    ? 'checkout-shipping-form__address-form'
    : 'checkout-billing-form__address-form',
});

/**
 * Formulario de dirección para invitados (shipping o billing).
 * Equivalente 1:1 al antiguo containers.js#renderAddressForm.
 * @param {HTMLElement} container
 * @param {{ current: object|null }} formRef
 * @param {object} data Cart data
 * @param {'shipping'|'billing'} addressType
 * @returns {Promise<object>} rendered container API
 */
async function renderGuestAddressForm(container, formRef, data, addressType) {
  const isShipping = addressType === 'shipping';
  const placeholders = await fetchPlaceholders('placeholders/checkout.json');
  const type = perType(isShipping, placeholders);

  const cartAddress = getCartAddress(data, addressType);
  const addressCache = sessionStorage.getItem(type.dataKey);

  // Clear persisted address if cart has an address
  if (cartAddress && addressCache) {
    sessionStorage.removeItem(type.dataKey);
  }

  let isFirstRender = true;
  const hasCartAddress = Boolean(isShipping ? data.shippingAddresses?.[0] : data.billingAddress);

  const setAddressOnCartFn = setAddressOnCart({
    type: addressType,
    debounceMs: DEBOUNCE_TIME,
  });

  // Shipping cost estimator (only for shipping addresses)
  const estimateShippingCostOnCart = isShipping ? estimateShippingCost({
    debounceMs: DEBOUNCE_TIME,
  }) : null;

  const notifyValues = debounce((values) => {
    emit(type.addressesEvent, values);
  }, ADDRESS_INPUT_DEBOUNCE_TIME);

  const storeConfig = checkoutApi.getStoreConfigCache();

  const addressTitle = isShipping
    ? placeholders?.Checkout?.Addresses?.shippingAddressTitle
    : placeholders?.Checkout?.Addresses?.billingAddressTitle;

  const inputsDefaultValueSet = cartAddress
    ? transformCartAddressToFormValues(cartAddress)
    : { countryCode: storeConfig.defaultCountry };

  return AccountProvider.render(AddressForm, {
    addressesFormTitle: addressTitle,
    className: type.guestClassName,
    fieldIdPrefix: addressType,
    formName: type.formName,
    forwardFormRef: formRef,
    hideActionFormButtons: true,
    inputsDefaultValueSet,
    isOpen: true,
    onChange: (values) => {
      const canSetAddressOnCart = !isFirstRender || !hasCartAddress;
      if (canSetAddressOnCart) setAddressOnCartFn(values);

      // Only estimate shipping cost for shipping addresses when no cart address exists
      if (isShipping && !hasCartAddress && estimateShippingCostOnCart) {
        estimateShippingCostOnCart(values);
      }

      if (isFirstRender) isFirstRender = false;

      notifyValues(values);
    },
    showBillingCheckBox: false,
    showFormLoader: false,
    showShippingCheckBox: false,
  })(container);
}

/**
 * Selector/formulario de direcciones para clientes autenticados (shipping o
 * billing). Unificación 1:1 de renderCustomerShippingAddresses y
 * renderCustomerBillingAddresses del boilerplate.
 * @param {HTMLElement} container
 * @param {{ current: object|null }} formRef
 * @param {object} data Cart data
 * @param {'shipping'|'billing'} addressType
 * @returns {Promise<object>} rendered container API
 */
async function renderCustomerAddresses(container, formRef, data, addressType) {
  const isShipping = addressType === 'shipping';
  const placeholders = await fetchPlaceholders('placeholders/checkout.json');
  const type = perType(isShipping, placeholders);

  const cartAddress = getCartAddress(data, addressType);

  const defaultSelectAddressId = cartAddress
    ? cartAddress?.id ?? 0
    : undefined;

  const addressCache = sessionStorage.getItem(type.dataKey);

  // Clear persisted address if cart has an address
  if (cartAddress && addressCache) {
    sessionStorage.removeItem(type.dataKey);
  }

  const storeConfig = checkoutApi.getStoreConfigCache();

  const inputsDefaultValueSet = cartAddress && cartAddress.id === undefined
    ? transformCartAddressToFormValues(cartAddress)
    : { countryCode: storeConfig.defaultCountry };

  const hasCartAddress = Boolean(isShipping ? data.shippingAddresses?.[0] : data.billingAddress);
  let isFirstRender = true;

  const setAddressOnCartFn = setAddressOnCart({
    type: addressType,
    debounceMs: DEBOUNCE_TIME,
  });

  // Shipping cost estimator (only for shipping addresses)
  const estimateShippingCostOnCart = isShipping ? estimateShippingCost({
    debounceMs: DEBOUNCE_TIME,
  }) : null;

  const notifyValues = debounce((values) => {
    emit(type.addressesEvent, values);
  }, ADDRESS_INPUT_DEBOUNCE_TIME);

  return AccountProvider.render(Addresses, {
    addressFormTitle: type.customerFormTitle,
    defaultSelectAddressId,
    // El original solo define fieldIdPrefix en shipping
    ...(isShipping ? { fieldIdPrefix: 'shipping' } : {}),
    formName: type.formName,
    forwardFormRef: formRef,
    inputsDefaultValueSet,
    minifiedView: false,
    onAddressData: (values) => {
      const canSetAddressOnCart = !isFirstRender || !hasCartAddress;
      if (canSetAddressOnCart) setAddressOnCartFn(values);
      if (isShipping && !hasCartAddress) estimateShippingCostOnCart(values);
      if (isFirstRender) isFirstRender = false;
      notifyValues(values);
    },
    selectable: true,
    ...(isShipping ? { selectShipping: true } : { selectBilling: true }),
    showBillingCheckBox: false,
    showSaveCheckBox: true,
    showShippingCheckBox: false,
    title: type.title,
  })(container);
}

/**
 * Crea la sección de direcciones del checkout.
 * @param {Record<string, HTMLElement>} refs Referencias del layout
 *   (usa refs.shippingForm, refs.billingForm, refs.billToShipping)
 * @returns {object} API de la sección
 */
export function createAddressesSection(refs) {
  const shippingFormRef = { current: null };
  const billingFormRef = { current: null };

  /** Instancias montadas (equivalen a las variables locales del original) */
  let shippingForm = null;
  let billingForm = null;
  let shippingAddresses = null;
  let billingAddresses = null;
  let shippingFormSkeleton = null;
  let billingFormSkeleton = null;

  return {
    shippingFormRef,
    billingFormRef,

    /** Skeleton inicial del formulario de shipping. */
    async mountShippingSkeleton() {
      shippingFormSkeleton = await AccountProvider.render(AddressForm, {
        fieldIdPrefix: 'shipping',
        isOpen: true,
        showFormLoader: true,
      })(refs.shippingForm);
      return shippingFormSkeleton;
    },

    /** Skeleton inicial del formulario de billing. */
    async mountBillingSkeleton() {
      billingFormSkeleton = await AccountProvider.render(AddressForm, {
        fieldIdPrefix: 'billing',
        isOpen: true,
        showFormLoader: true,
      })(refs.billingForm);
      return billingFormSkeleton;
    },

    /** Checkbox "billing igual que shipping". */
    async renderBillToShipping() {
      const setBillingAddressOnCart = setAddressOnCart({ type: 'billing' });

      return CheckoutProvider.render(BillToShippingAddress, {
        onChange: (checked) => {
          const billingFormValues = lastPayload(EVENTS.CHECKOUT_ADDRESSES_BILLING);

          if (!checked && billingFormValues) {
            setBillingAddressOnCart(billingFormValues);
          }
        },
      })(refs.billToShipping);
    },

    /** Modo invitado: formularios de dirección (o nada si el carrito es virtual). */
    async displayGuestAddressForms(data) {
      if (isVirtualCart(data)) {
        shippingForm?.remove();
        shippingForm = null;
        refs.shippingForm.innerHTML = '';
      } else if (!shippingForm) {
        shippingFormSkeleton?.remove();

        shippingForm = await renderGuestAddressForm(
          refs.shippingForm,
          shippingFormRef,
          data,
          'shipping',
        );
      }

      if (!billingForm) {
        billingFormSkeleton?.remove();

        billingForm = await renderGuestAddressForm(
          refs.billingForm,
          billingFormRef,
          data,
          'billing',
        );
      }
    },

    /** Modo cliente autenticado: selectores de direcciones guardadas. */
    async displayCustomerAddressForms(data) {
      if (isVirtualCart(data)) {
        shippingAddresses?.remove();
        shippingAddresses = null;
        refs.shippingForm.innerHTML = '';
      } else if (!shippingAddresses) {
        shippingForm?.remove();
        shippingForm = null;
        shippingFormRef.current = null;

        shippingAddresses = await renderCustomerAddresses(
          refs.shippingForm,
          shippingFormRef,
          data,
          'shipping',
        );
      }

      if (!billingAddresses) {
        billingForm?.remove();
        billingForm = null;
        billingFormRef.current = null;

        billingAddresses = await renderCustomerAddresses(
          refs.billingForm,
          billingFormRef,
          data,
          'billing',
        );
      }
    },

    /** Muestra/oculta el formulario de billing según isBillToShipping. */
    setBillingVisibility(isBillToShipping) {
      refs.billingForm.style.display = isBillToShipping ? 'none' : 'block';
    },
  };
}
