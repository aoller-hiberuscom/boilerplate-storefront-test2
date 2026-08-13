/**
 * sections/shell.js — Marco de página del checkout: cabecera, banner de
 * carrito fusionado, error de servidor y aviso de stock agotado.
 *
 * Cada sección expone funciones render*(container) equivalentes 1:1 a las
 * del antiguo containers.js (sin el registry: el ciclo de vida lo gobierna
 * el orquestador, que monta cada sección una única vez).
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import MergedCartBanner from '@dropins/storefront-checkout/containers/MergedCartBanner.js';
import OutOfStock from '@dropins/storefront-checkout/containers/OutOfStock.js';
import ServerError from '@dropins/storefront-checkout/containers/ServerError.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import { Header, provider as UI } from '@dropins/tools/components.js';
import { rootLink } from '../../../scripts/core/routes.js';
import { logger } from '../../../scripts/core/logger.js';
import { CHECKOUT_ERROR_CLASS, CHECKOUT_HEADER_CLASS } from '../constants.js';

/**
 * Renders the merged cart banner notification for authenticated users.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderMergedCartBanner = (container) => (
  CheckoutProvider.render(MergedCartBanner)(container)
);

/**
 * Renders the checkout page header with title and styling.
 * @param {HTMLElement} container
 * @param {string} title
 * @returns {Promise<object>} rendered container API
 */
export const renderCheckoutHeader = (container, title) => UI.render(Header, {
  className: CHECKOUT_HEADER_CLASS,
  divider: true,
  level: 1,
  size: 'large',
  title,
})(container);

/**
 * Renders server error handling with retry functionality.
 * @param {HTMLElement} container
 * @param {HTMLElement} contentElement Main content element to toggle error styling
 * @returns {Promise<object>} rendered container API
 */
export const renderServerError = (container, contentElement) => (
  CheckoutProvider.render(ServerError, {
    autoScroll: true,
    onRetry: (error) => {
      if (error.code === 'PERMISSION_DENIED') {
        document.location.reload();
        return;
      }

      contentElement.classList.remove(CHECKOUT_ERROR_CLASS);
    },
    onServerError: () => {
      contentElement.classList.add(CHECKOUT_ERROR_CLASS);
    },
  })(container)
);

/**
 * Renders out-of-stock handling with cart navigation and product updates.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderOutOfStock = (container) => CheckoutProvider.render(OutOfStock, {
  routeCart: () => rootLink('/cart'),
  onCartProductsUpdate: (items) => {
    cartApi.updateProductsFromCart(items).catch((e) => logger.error(e));
  },
})(container);
