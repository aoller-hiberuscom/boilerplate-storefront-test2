/**
 * sections/place-order.js — Botón de confirmar pedido y términos/condiciones.
 *
 * El botón se monta ANTES que el resto de secciones (requisito del dropin:
 * los demás containers dependen de que exista).
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import PlaceOrder from '@dropins/storefront-checkout/containers/PlaceOrder.js';
import TermsAndConditions from '@dropins/storefront-checkout/containers/TermsAndConditions.js';

/**
 * Renders place order button with handler functions.
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Function} options.handleValidation - Validation handler
 * @param {Function} options.handlePlaceOrder - Place order handler
 * @returns {Promise<object>} rendered container API
 */
export const renderPlaceOrder = (container, options = {}) => (
  CheckoutProvider.render(PlaceOrder, {
    handleValidation: options.handleValidation,
    handlePlaceOrder: options.handlePlaceOrder,
  })(container)
);

/**
 * Renders terms and conditions with agreement slots and manual consent mode.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderTermsAndConditions = (container) => (
  CheckoutProvider.render(TermsAndConditions, {
    slots: {
      Agreements: (ctx) => {
        ctx.appendAgreement(() => ({
          name: 'default',
          mode: 'manual',
          translationId: 'Checkout.TermsAndConditions.label',
        }));
      },
    },
  })(container)
);
