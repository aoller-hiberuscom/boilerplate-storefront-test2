/**
 * commerce-checkout.js — Orquestador del checkout.
 *
 * Composición por secciones (ver ./sections/): el orquestador crea el layout,
 * monta las secciones y cablea el estado entre ellas exclusivamente a través
 * de eventos y de las APIs que cada sección expone. La lógica de cada área
 * vive en su sección; aquí solo hay coordinación.
 *
 * Equivalencia con el boilerplate: mismo orden de montaje (place-order
 * primero, resto en paralelo), mismos eventos con los mismos flags y misma
 * gestión guest/customer/virtual (delegada en sections/addresses.js).
 */

// Dropin Tools
import { initReCaptcha } from '@dropins/tools/recaptcha.js';

// Order Dropin Modules
import * as orderApi from '@dropins/storefront-order/api.js';

// Checkout Dropin Libraries
import { setMetaTags, validateForms } from '@dropins/storefront-checkout/lib/utils.js';

// Payment Services Dropin
import { PaymentMethodCode } from '@dropins/storefront-payment-services/api.js';

// Capas del proyecto
import { EVENTS, on, lastPayload } from '../../scripts/core/events.js';
import { rootLink } from '../../scripts/core/routes.js';
import { logger } from '../../scripts/core/logger.js';
import { ensureCapability } from '../../scripts/dropins/registry.js';

// Block: layout, utilidades y secciones
import { createCheckoutLayout } from './layout.js';
import {
  buildOrderDetailsUrl,
  displayOverlaySpinner,
  removeOverlaySpinner,
} from './utils.js';
import {
  renderCheckoutHeader,
  renderMergedCartBanner,
  renderOutOfStock,
  renderServerError,
} from './sections/shell.js';
import { renderLoginForm } from './sections/login.js';
import { createAddressesSection } from './sections/addresses.js';
import { renderShippingMethods } from './sections/delivery.js';
import { createPaymentSection } from './sections/payment.js';
import {
  renderCartSummaryList,
  renderGiftOptions,
  renderOrderSummary,
} from './sections/summary.js';
import { renderPlaceOrder, renderTermsAndConditions } from './sections/place-order.js';

// Constants
import {
  BILLING_ADDRESS_DATA_KEY,
  BILLING_FORM_NAME,
  LOGIN_FORM_NAME,
  PURCHASE_ORDER_FORM_NAME,
  SHIPPING_ADDRESS_DATA_KEY,
  SHIPPING_FORM_NAME,
  TERMS_AND_CONDITIONS_FORM_NAME,
} from './constants.js';

// Checkout success block import and CSS preload
import { renderCheckoutSuccess, preloadCheckoutSuccess } from '../commerce-checkout-success/commerce-checkout-success.js';

preloadCheckoutSuccess();

function redirectToCartIfEmpty(cartData) {
  const isOrderPlaced = lastPayload(EVENTS.ORDER_PLACED) !== undefined;

  if (!isOrderPlaced && (cartData === null || cartData?.items?.length === 0)) {
    window.location.href = rootLink('/cart');
  }
}

export default async function decorate(block) {
  // Capacidades commerce requeridas (mismo orden que los antiguos
  // imports side-effect de scripts/initializers/*)
  await ensureCapability('account');
  await ensureCapability('checkout');
  await ensureCapability('order');
  await ensureCapability('payment-services');

  setMetaTags('Checkout');
  document.title = 'Checkout';

  const cartData = lastPayload(EVENTS.CART_INITIALIZED);
  redirectToCartIfEmpty(cartData);

  const loaderRef = { current: null };

  on(EVENTS.ORDER_PLACED, () => {
    setMetaTags('Order Confirmation');
    document.title = 'Order Confirmation';
  });

  // Layout: única fuente de verdad del DOM (clases CSS + data-ref)
  const { root, refs } = createCheckoutLayout();
  block.appendChild(root);

  // Secciones con estado propio
  const addresses = createAddressesSection(refs);
  const payment = createPaymentSection();

  const handleValidation = () => validateForms([
    { name: LOGIN_FORM_NAME },
    { name: SHIPPING_FORM_NAME, ref: addresses.shippingFormRef },
    { name: BILLING_FORM_NAME, ref: addresses.billingFormRef },
    { name: PURCHASE_ORDER_FORM_NAME },
    { name: TERMS_AND_CONDITIONS_FORM_NAME },
  ]);

  const handlePlaceOrder = async ({ cartId, code }) => {
    await displayOverlaySpinner(loaderRef, refs.loader);
    try {
      // Payment Services credit card
      if (code === PaymentMethodCode.CREDIT_CARD) {
        const creditCardForm = payment.creditCardFormRef.current;
        if (!creditCardForm) {
          logger.error('Credit card form not rendered.');
          return;
        }
        if (!creditCardForm.validate()) {
          // Credit card form invalid; abort order placement
          return;
        }
        // Submit Payment Services credit card form
        await creditCardForm.submit();
      }
      // Place order
      await orderApi.placeOrder(cartId);
    } catch (error) {
      logger.error(error);
      throw error;
    } finally {
      removeOverlaySpinner(loaderRef, refs.loader);
    }
  };

  // First, render the place order component (el resto depende de su presencia)
  await renderPlaceOrder(refs.placeOrder, { handleValidation, handlePlaceOrder });

  // Render the remaining sections in parallel
  await Promise.all([
    renderMergedCartBanner(refs.mergedCartBanner),
    renderCheckoutHeader(refs.heading, 'Checkout'),
    renderServerError(refs.serverError, refs.content),
    renderOutOfStock(refs.outOfStock),
    renderLoginForm(refs.login),
    addresses.mountShippingSkeleton(),
    addresses.renderBillToShipping(),
    renderShippingMethods(refs.delivery),
    payment.mount(refs.paymentMethods),
    addresses.mountBillingSkeleton(),
    renderOrderSummary(refs.orderSummary),
    renderCartSummaryList(refs.cartSummary),
    renderTermsAndConditions(refs.termsAndConditions),
    renderGiftOptions(refs.giftOptions),
  ]);

  async function initializeCheckout(data) {
    await initReCaptcha(0);
    if (data.isGuest) await addresses.displayGuestAddressForms(data);
    else {
      removeOverlaySpinner(loaderRef, refs.loader);
      await addresses.displayCustomerAddressForms(data);
    }
  }

  async function handleCheckoutUpdated(data) {
    if (!data) return;
    await initializeCheckout(data);
  }

  function handleAuthenticated(authenticated) {
    if (!authenticated) return;

    // When a customer creates an account on the checkout success page and then
    // signs in, they will be redirected to the order details page with the order
    // number as orderRef, allowing the order details to be displayed
    const orderData = lastPayload(EVENTS.ORDER_PLACED);
    if (orderData) {
      const url = buildOrderDetailsUrl(orderData);
      window.history.pushState({}, '', url);
    }

    window.location.reload();
  }

  function handleCheckoutValues(payload) {
    const { isBillToShipping } = payload;
    addresses.setBillingVisibility(isBillToShipping);
  }

  async function handleOrderPlaced(orderData) {
    // Clear address form data
    sessionStorage.removeItem(SHIPPING_ADDRESS_DATA_KEY);
    sessionStorage.removeItem(BILLING_ADDRESS_DATA_KEY);

    const url = buildOrderDetailsUrl(orderData);

    window.history.pushState({}, '', url);

    await renderCheckoutSuccess(block, { orderData });
  }

  on(EVENTS.AUTHENTICATED, handleAuthenticated);
  on(EVENTS.CHECKOUT_INITIALIZED, handleCheckoutUpdated, { eager: true });
  on(EVENTS.CHECKOUT_UPDATED, handleCheckoutUpdated);
  on(EVENTS.CHECKOUT_VALUES, handleCheckoutValues);
  on(EVENTS.ORDER_PLACED, handleOrderPlaced);
  on(EVENTS.CART_INITIALIZED, redirectToCartIfEmpty, { eager: true });
  on(EVENTS.CART_DATA, redirectToCartIfEmpty);
}
