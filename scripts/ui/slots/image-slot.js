/**
 * ui/slots/image-slot.js — Slot compartido de imagen de producto.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Consolida el patrón repetido ~40 veces en los blocks: renderizar la imagen
 * de un item (Thumbnail/ProductImage/OrderItemImage…) con AEM Assets si está
 * habilitado, opcionalmente envuelta en un enlace al producto.
 */
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';

/**
 * Alias por defecto: sku del item del slot, sea cual sea la forma del ctx
 * (cart item, order item, search hit…).
 * @param {object} ctx
 * @returns {string|undefined}
 */
function defaultAlias(ctx) {
  return ctx.item?.sku ?? ctx.data?.product?.sku ?? ctx.product?.sku;
}

/**
 * Renderiza la imagen por defecto del contexto de slot dentro de un wrapper.
 * @param {object} ctx Contexto del slot del dropin (item/data, defaultImageProps…)
 * @param {object} [options]
 * @param {string} [options.alias] Alias de asset (por defecto, el sku del item)
 * @param {HTMLElement} [options.wrapper] Nodo contenedor (por defecto, <span>)
 * @param {object} [options.params] Overrides de parámetros de imagen
 */
export function renderImageSlot(ctx, { alias, wrapper, params } = {}) {
  const { defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: alias ?? defaultAlias(ctx),
    imageProps: defaultImageProps,
    wrapper: wrapper ?? document.createElement('span'),
    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
      ...params,
    },
  });
}

/**
 * Crea una función de slot que renderiza la imagen envuelta en un enlace.
 * @param {(ctx: object) => string} getHref Construye el href a partir del ctx del slot
 * @param {{ alias?: (ctx: object) => string }} [options]
 * @returns {(ctx: object) => void} Función de slot lista para usar
 */
export function linkedImageSlot(getHref, { alias } = {}) {
  return (ctx) => {
    const anchor = document.createElement('a');
    anchor.href = getHref(ctx);
    renderImageSlot(ctx, {
      alias: alias ? alias(ctx) : undefined,
      wrapper: anchor,
    });
  };
}
