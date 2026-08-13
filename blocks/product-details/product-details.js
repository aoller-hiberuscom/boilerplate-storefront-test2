/**
 * blocks/product-details/product-details.js — Block de detalle de producto (PDP).
 *
 * Responsabilidad: declarar el layout (createLayout con data-ref), montar los
 * containers del dropin de PDP (galerías, header, precio, opciones…) y el
 * toggle de wishlist, y registrar los listeners del event bus delegando la
 * lógica en add-to-cart.js, gallery.js y scripts/domain/seo.js.
 */
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';

import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Capas propias
import { rootLink } from '../../scripts/core/routes.js';
import { EVENTS, on, lastPayload } from '../../scripts/core/events.js';
import { fetchPlaceholders } from '../../scripts/core/i18n.js';
import {
  setJsonLdProduct,
  setMetaTags,
  isProductPrerendered,
} from '../../scripts/domain/seo.js';
import { ensureCapability } from '../../scripts/dropins/registry.js';
import { createLayout } from '../../scripts/ui/layout.js';

// Módulos del block
import { createAddToCartArea } from './add-to-cart.js';
import { getGalleryConfigs, swatchImageSlot } from './gallery.js';

/**
 * Formats numeric attribute values for display (e.g., "10.000000" → "10").
 * Non-numeric values are returned as-is.
 * @param {string} value Valor del atributo
 * @returns {string} Valor formateado
 */
function formatNumericAttributeValue(value) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return value;
  return new Intl.NumberFormat(document.documentElement.lang).format(Number(trimmed));
}

/**
 * Decora el block de PDP: capacidades, layout, containers y listeners.
 * @param {HTMLElement} block
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  // Capacidades commerce que requiere este block
  await Promise.all([
    ensureCapability('pdp'),
    ensureCapability('cart'),
    ensureCapability('wishlist'),
  ]);

  const eventProduct = lastPayload(EVENTS.PDP_DATA) ?? null;
  // bug: the pdp sends an object with event data even if product is not found.
  const product = eventProduct?.sku ? eventProduct : null;

  const labels = await fetchPlaceholders();

  // Read itemUid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');

  // Layout
  const { root, refs } = createLayout(`
    <div class="product-details__alert" data-ref="alert"></div>
    <div class="product-details__wrapper">
      <div class="product-details__left-column">
        <div class="product-details__gallery" data-ref="gallery"></div>
      </div>
      <div class="product-details__right-column">
        <div class="product-details__header" data-ref="header"></div>
        <div class="product-details__price" data-ref="price"></div>
        <div class="product-details__gallery" data-ref="galleryMobile"></div>
        <div class="product-details__short-description" data-ref="shortDescription"></div>
        <div class="product-details__gift-card-options" data-ref="giftCardOptions"></div>
        <div class="product-details__configuration">
          <div class="product-details__options" data-ref="options"></div>
          <div class="product-details__quantity" data-ref="quantity"></div>
          <div class="product-details__buttons">
            <div class="product-details__buttons__add-to-cart" data-ref="addToCart"></div>
            <div class="product-details__buttons__add-to-wishlist" data-ref="wishlistToggle"></div>
          </div>
        </div>
        <div class="product-details__description" data-ref="description"></div>
        <div class="product-details__attributes" data-ref="attributes"></div>
      </div>
    </div>
  `);

  block.replaceChildren(root);

  const galleryConfigs = getGalleryConfigs();
  const routeToWishlist = rootLink('/wishlist');

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    wishlistToggleBtn,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, galleryConfigs.mobile)(refs.galleryMobile),

    // Gallery (Desktop)
    pdpRendered.render(ProductGallery, galleryConfigs.desktop)(refs.gallery),

    // Header
    pdpRendered.render(ProductHeader, {})(refs.header),

    // Price
    pdpRendered.render(ProductPrice, {})(refs.price),

    // Short Description
    pdpRendered.render(ProductShortDescription, {})(refs.shortDescription),

    // Configuration - Swatches
    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: swatchImageSlot,
      },
    })(refs.options),

    // Configuration  Quantity
    pdpRendered.render(ProductQuantity, {})(refs.quantity),

    // Configuration  Gift Card Options
    pdpRendered.render(ProductGiftCardOptions, {})(refs.giftCardOptions),

    // Description
    pdpRendered.render(ProductDescription, {})(refs.description),

    // Attributes
    pdpRendered.render(ProductAttributes, {
      formatValue: formatNumericAttributeValue,
    })(refs.attributes),

    // Wishlist button - WishlistToggle Container
    wishlistRender.render(WishlistToggle, {
      product,
    })(refs.wishlistToggle),
  ]);

  // Configuration – Button - Add to Cart
  const addToCartArea = await createAddToCartArea({
    refs,
    labels,
    itemUid: itemUidFromUrl,
  });

  // Lifecycle Events
  on(EVENTS.PDP_DATA, addToCartArea.onProductData, { eager: true });

  on(EVENTS.PDP_VALID, addToCartArea.onValidityChange, { eager: true });

  // Handle option changes
  on(EVENTS.PDP_VALUES, () => {
    if (wishlistToggleBtn) {
      const configValues = pdpApi.getProductConfigurationValues();

      // Check URL parameter for empty optionsUIDs
      const urlOptionsUIDs = urlParams.get('optionsUIDs');

      // If URL has empty optionsUIDs parameter, treat as base product (no options)
      const optionUIDs = urlOptionsUIDs === '' ? undefined : (configValues?.optionsUIDs || undefined);

      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
        },
      }));
    }
  }, { eager: true });

  on(EVENTS.WISHLIST_ALERT, ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })(refs.alert);

    setTimeout(() => {
      refs.alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      refs.alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  });

  // --- Add new event listener for cart/data ---
  on(EVENTS.CART_DATA, addToCartArea.onCartData, { eager: true });

  // Set JSON-LD and Meta Tags
  on(EVENTS.LCP, () => {
    const isPrerendered = isProductPrerendered();
    if (product && !isPrerendered) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  return Promise.resolve();
}
