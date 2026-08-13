/**
 * sections/delivery.js — Métodos de envío.
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import ShippingMethods from '@dropins/storefront-checkout/containers/ShippingMethods.js';

/**
 * Renders available shipping methods with selection interface.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderShippingMethods = (container) => (
  CheckoutProvider.render(ShippingMethods)(container)
);
