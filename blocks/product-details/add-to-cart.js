/**
 * blocks/product-details/add-to-cart.js — Botón Add to Cart / Update del PDP.
 *
 * Responsabilidad: crear el botón de añadir/actualizar carrito, gestionar el
 * modo (add vs update según el itemUid de la URL y el contenido del carrito),
 * validar la configuración del producto, redirigir a /cart tras actualizar y
 * mostrar la alerta inline de error. Expone handlers de estado para que el
 * block los registre en el event bus (pdp/data, pdp/valid, cart/data).
 */
import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';

import { rootLink } from '../../scripts/core/routes.js';
import { logger } from '../../scripts/core/logger.js';

// Function to update the Add to Cart button text
function updateAddToCartButtonText(addToCartInstance, inCart, labels) {
  const buttonText = inCart
    ? labels.Global?.UpdateProductInCart
    : labels.Global?.AddProductToCart;
  if (addToCartInstance) {
    addToCartInstance.setProps((prev) => ({
      ...prev,
      children: buttonText,
    }));
  }
}

/**
 * Crea el área add-to-cart del PDP: el botón y sus handlers de estado.
 * @param {object} options
 * @param {Record<string, HTMLElement>} options.refs Referencias del layout:
 *   usa refs.addToCart como target del botón y refs.alert para las alertas.
 * @param {object} options.labels Placeholders de textos (fetchPlaceholders).
 * @param {string|null} options.itemUid itemUid leído de la URL (modo update).
 * @returns {Promise<{
 *   button: object,
 *   onProductData: (data: object) => void,
 *   onValidityChange: (valid: boolean) => void,
 *   onCartData: (cartData: object) => void,
 * }>} Botón montado y handlers para pdp/data, pdp/valid y cart/data.
 */
export async function createAddToCartArea({ refs, labels, itemUid }) {
  // State to track if we are in update mode
  let isUpdateMode = false;

  // State to track if the current product/variant is out of stock
  let isOutOfStock = false;

  // Alert
  let inlineAlert = null;

  const addToCart = await UI.render(Button, {
    children: labels.Global?.AddProductToCart,
    icon: h(Icon, { source: 'Cart' }),
    onClick: async () => {
      const buttonActionText = isUpdateMode
        ? labels.Global?.UpdatingInCart
        : labels.Global?.AddingToCart;
      try {
        addToCart.setProps((prev) => ({
          ...prev,
          children: buttonActionText,
          disabled: true,
        }));

        // get the current selection values
        const values = pdpApi.getProductConfigurationValues();
        const valid = pdpApi.isProductConfigurationValid();

        // add or update the product in the cart
        if (valid) {
          if (isUpdateMode) {
            // --- Update existing item ---
            const { updateProductsFromCart } = await import(
              '@dropins/storefront-cart/api.js'
            );

            await updateProductsFromCart([{ ...values, uid: itemUid }]);

            // --- START REDIRECT ON UPDATE ---
            const updatedSku = values?.sku;
            if (updatedSku) {
              const cartRedirectUrl = new URL(
                rootLink('/cart'),
                window.location.origin,
              );
              cartRedirectUrl.searchParams.set('itemUid', itemUid);
              window.location.href = cartRedirectUrl.toString();
            } else {
              // Fallback if SKU is somehow missing (shouldn't happen in normal flow)
              logger.warn(
                'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
              );
              window.location.href = rootLink('/cart');
            }
            return;
          }
          // --- Add new item ---
          const { addProductsToCart } = await import(
            '@dropins/storefront-cart/api.js'
          );
          await addProductsToCart([{ ...values }]);
        }

        // reset any previous alerts if successful
        inlineAlert?.remove();
      } catch (error) {
        // add alert message
        inlineAlert = await UI.render(InLineAlert, {
          heading: labels.Global?.Error || 'Error',
          description: error.message,
          icon: h(Icon, { source: 'Warning' }),
          'aria-live': 'assertive',
          role: 'alert',
          onDismiss: () => {
            inlineAlert.remove();
          },
        })(refs.alert);

        // Scroll the alertWrapper into view
        refs.alert.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        // Reset button text using the helper function which respects the current mode
        updateAddToCartButtonText(addToCart, isUpdateMode, labels);
        // Re-enable button, unless the current variant is out of stock
        addToCart.setProps((prev) => ({
          ...prev,
          disabled: isOutOfStock,
        }));
      }
    },
  })(refs.addToCart);

  return {
    button: addToCart,

    onProductData: (data) => {
      isOutOfStock = data?.inStock === false;
      addToCart.setProps((prev) => ({ ...prev, disabled: isOutOfStock }));
    },

    onValidityChange: (valid) => {
      // update add to cart button disabled state based on product selection validity
      // and stock status
      addToCart.setProps((prev) => ({ ...prev, disabled: isOutOfStock || !valid }));
    },

    onCartData: (cartData) => {
      let itemIsInCart = false;
      if (itemUid && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUid,
        );
      }
      // Set the update mode state
      isUpdateMode = itemIsInCart;

      // Update button text based on whether the item is in the cart
      updateAddToCartButtonText(addToCart, itemIsInCart, labels);
    },
  };
}
