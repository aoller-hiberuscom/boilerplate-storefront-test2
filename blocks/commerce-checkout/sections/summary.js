/**
 * sections/summary.js — Columna resumen: order summary (con envío estimado,
 * cupones y gift cards), lista de productos del carrito y gift options.
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import EstimateShipping from '@dropins/storefront-checkout/containers/EstimateShipping.js';
import { render as CartProvider } from '@dropins/storefront-cart/render.js';
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import Coupons from '@dropins/storefront-cart/containers/Coupons.js';
import GiftCards from '@dropins/storefront-cart/containers/GiftCards.js';
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import OrderSummary from '@dropins/storefront-cart/containers/OrderSummary.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { swatchImageSlot } from '../../../scripts/ui/slots/swatch-slot.js';
import { fetchPlaceholders } from '../../../scripts/core/i18n.js';
import { rootLink } from '../../../scripts/core/routes.js';

/**
 * Renders estimate shipping form for order summary slot.
 * @param {object} ctx - The slot context
 */
const renderEstimateShipping = (ctx) => {
  const estimateShippingForm = document.createElement('div');
  CheckoutProvider.render(EstimateShipping)(estimateShippingForm);
  ctx.appendChild(estimateShippingForm);
};

/**
 * Renders cart coupons for order summary slot.
 * @param {object} ctx - The slot context
 */
const renderCartCoupons = (ctx) => {
  const coupons = document.createElement('div');
  CartProvider.render(Coupons)(coupons);
  ctx.appendChild(coupons);
};

/**
 * Renders gift cards for order summary slot.
 * @param {object} ctx - The slot context
 */
const renderGiftCards = (ctx) => {
  const giftCards = document.createElement('div');
  CartProvider.render(GiftCards)(giftCards);
  ctx.appendChild(giftCards);
};

/**
 * Renders gift options for cart summary list footer slot.
 * @param {object} ctx - The slot context
 */
const renderCartGiftOptions = (ctx) => {
  const giftOptions = document.createElement('div');

  CartProvider.render(GiftOptions, {
    item: ctx.item,
    view: 'product',
    dataSource: 'cart',
    isEditable: false,
    handleItemsLoading: ctx.handleItemsLoading,
    handleItemsError: ctx.handleItemsError,
    onItemUpdate: ctx.onItemUpdate,
    slots: {
      SwatchImage: swatchImageSlot,
    },
  })(giftOptions);

  ctx.appendChild(giftOptions);
};

/**
 * Renders order summary with estimate shipping, coupons and gift cards slots.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderOrderSummary = (container) => CartProvider.render(OrderSummary, {
  slots: {
    EstimateShipping: renderEstimateShipping,
    Coupons: renderCartCoupons,
    GiftCards: renderGiftCards,
  },
})(container);

/**
 * Renders cart summary list with custom heading, thumbnail and gift options.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderCartSummaryList = async (container) => {
  const placeholders = await fetchPlaceholders('placeholders/checkout.json');

  return CartProvider.render(CartSummaryList, {
    variant: 'secondary',
    slots: {
      Heading: (headingCtx) => {
        const title = placeholders?.Checkout?.Summary?.heading;

        const cartSummaryListHeading = document.createElement('div');
        cartSummaryListHeading.classList.add('cart-summary-list__heading');

        const cartSummaryListHeadingText = document.createElement('div');
        cartSummaryListHeadingText.classList.add(
          'cart-summary-list__heading-text',
        );

        cartSummaryListHeadingText.innerText = title?.replace(
          '({count})',
          headingCtx.count ? `(${headingCtx.count})` : '',
        );
        const editCartLink = document.createElement('a');
        editCartLink.classList.add('cart-summary-list__edit');
        editCartLink.href = rootLink('/cart');
        editCartLink.rel = 'noreferrer';
        editCartLink.innerText = placeholders?.Checkout?.Summary?.Edit;

        cartSummaryListHeading.appendChild(cartSummaryListHeadingText);
        cartSummaryListHeading.appendChild(editCartLink);
        headingCtx.appendChild(cartSummaryListHeading);

        headingCtx.onChange((nextHeadingCtx) => {
          cartSummaryListHeadingText.innerText = title?.replace(
            '({count})',
            nextHeadingCtx.count ? `(${nextHeadingCtx.count})` : '',
          );
        });
      },
      // Nota: el original no pasa wrapper (a diferencia del slot compartido
      // de ui/slots/image-slot.js, que envuelve en <span>): se mantiene la
      // llamada directa para preservar el DOM 1:1.
      Thumbnail: (ctx) => {
        const { item, defaultImageProps } = ctx;
        tryRenderAemAssetsImage(ctx, {
          alias: item.sku,
          imageProps: defaultImageProps,

          params: {
            width: defaultImageProps.width,
            height: defaultImageProps.height,
          },
        });
      },
      Footer: renderCartGiftOptions,
    },
  })(container);
};

/**
 * Renders order-level gift options with swatch image integration.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderGiftOptions = (container) => CartProvider.render(GiftOptions, {
  view: 'order',
  dataSource: 'cart',
  isEditable: false,
  slots: {
    SwatchImage: swatchImageSlot,
  },
})(container);
