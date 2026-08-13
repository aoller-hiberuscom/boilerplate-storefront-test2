/**
 * sections/payment.js — Métodos de pago (con tarjeta vía Payment Services).
 *
 * La sección es dueña del creditCardFormRef que el orquestador usa en
 * handlePlaceOrder (validate + submit antes de placeOrder).
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import PaymentMethods from '@dropins/storefront-checkout/containers/PaymentMethods.js';
import { PaymentMethodCode } from '@dropins/storefront-payment-services/api.js';
import CreditCard from '@dropins/storefront-payment-services/containers/CreditCard.js';
import { render as PaymentServices } from '@dropins/storefront-payment-services/render.js';

/**
 * Crea la sección de pago.
 * @returns {{ creditCardFormRef: { current: object|null }, mount: Function }}
 */
export function createPaymentSection() {
  const creditCardFormRef = { current: null };

  return {
    creditCardFormRef,

    /**
     * Renders payment methods with credit card integration.
     * Los métodos deshabilitados replican la configuración del boilerplate.
     * @param {HTMLElement} container
     * @returns {Promise<object>} rendered container API
     */
    mount(container) {
      return CheckoutProvider.render(PaymentMethods, {
        slots: {
          Methods: {
            [PaymentMethodCode.CREDIT_CARD]: {
              render: (ctx) => {
                const $creditCard = document.createElement('div');

                PaymentServices.render(CreditCard, {
                  getCartId: () => ctx.cartId,
                  creditCardFormRef,
                })($creditCard);

                ctx.replaceHTML($creditCard);
              },
            },
            [PaymentMethodCode.SMART_BUTTONS]: {
              enabled: false,
            },
            [PaymentMethodCode.APPLE_PAY]: {
              enabled: false,
            },
            [PaymentMethodCode.APM]: {
              enabled: false,
            },
            [PaymentMethodCode.GOOGLE_PAY]: {
              enabled: false,
            },
            [PaymentMethodCode.VAULT]: {
              enabled: false,
            },
            [PaymentMethodCode.FASTLANE]: {
              enabled: false,
            },
          },
        },
      })(container);
    },
  };
}
