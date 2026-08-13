/**
 * ui/slots/swatch-slot.js — Slot compartido de imagen de swatch.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Consolida las 4 copias idénticas de swatchImageSlot que había en
 * commerce-checkout/utils.js, commerce-checkout/containers.js,
 * commerce-checkout-success y commerce-cart.
 */
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

/**
 * Renders AEM asset images for option swatches (e.g. gift options).
 * @param {object} ctx - Slot context containing imageSwatchContext and defaultImageProps
 */
export function swatchImageSlot(ctx) {
  const { imageSwatchContext, defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: imageSwatchContext.label,
    imageProps: defaultImageProps,
    wrapper: document.createElement('span'),
    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  });
}
