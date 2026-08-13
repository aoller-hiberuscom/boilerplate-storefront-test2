/**
 * layout.js — Scaffold del checkout con referencias declarativas (data-ref).
 *
 * Única fuente de verdad del DOM del checkout: las clases CSS que consume
 * commerce-checkout.css se mantienen intactas; los atributos data-ref son
 * solo para obtener referencias (ver scripts/ui/layout.js).
 *
 * Sustituye a fragments.js (scaffold string + mapa de selectores +
 * querySelectors: tres fuentes de verdad para lo mismo).
 */
import { createLayout } from '../../scripts/ui/layout.js';
import { CHECKOUT_BLOCK } from './constants.js';

/**
 * @returns {{ root: DocumentFragment, refs: Record<string, HTMLElement> }}
 *   refs: content, loader, mergedCartBanner, heading, serverError, outOfStock,
 *   login, shippingForm, billToShipping, delivery, paymentMethods, billingForm,
 *   termsAndConditions, placeOrder, orderSummary, giftOptions, cartSummary
 */
export function createCheckoutLayout() {
  return createLayout(`
    <div class="checkout__wrapper">
      <div class="checkout__loader" data-ref="loader"></div>
      <div class="checkout__content" data-ref="content">
        <div class="checkout__merged-cart-banner" data-ref="mergedCartBanner"></div>
        <div class="checkout__main">
          <div class="checkout__heading ${CHECKOUT_BLOCK}" data-ref="heading"></div>
          <div class="checkout__server-error ${CHECKOUT_BLOCK}" data-ref="serverError"></div>
          <div class="checkout__out-of-stock ${CHECKOUT_BLOCK}" data-ref="outOfStock"></div>
          <div class="checkout__login ${CHECKOUT_BLOCK}" data-ref="login"></div>
          <div class="checkout__shipping-form ${CHECKOUT_BLOCK}" data-ref="shippingForm"></div>
          <div class="checkout__bill-to-shipping ${CHECKOUT_BLOCK}" data-ref="billToShipping"></div>
          <div class="checkout__delivery ${CHECKOUT_BLOCK}" data-ref="delivery"></div>
          <div class="checkout__payment-methods ${CHECKOUT_BLOCK}" data-ref="paymentMethods"></div>
          <div class="checkout__billing-form ${CHECKOUT_BLOCK}" data-ref="billingForm"></div>
          <div class="checkout__terms-and-conditions ${CHECKOUT_BLOCK}" data-ref="termsAndConditions"></div>
          <div class="checkout__place-order ${CHECKOUT_BLOCK}" data-ref="placeOrder"></div>
        </div>
        <div class="checkout__aside">
          <div class="checkout__order-summary ${CHECKOUT_BLOCK}" data-ref="orderSummary"></div>
          <div class="checkout__gift-options ${CHECKOUT_BLOCK}" data-ref="giftOptions"></div>
          <div class="checkout__cart-summary ${CHECKOUT_BLOCK}" data-ref="cartSummary"></div>
        </div>
      </div>
    </div>
  `);
}
