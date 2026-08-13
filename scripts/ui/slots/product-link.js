/**
 * ui/slots/product-link.js — Construcción unificada de enlaces a producto.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Consolida las 6 definiciones locales de createProductLink que había en los
 * blocks, con sus dos firmas distintas ({urlKey, sku} vs {url.urlKey,
 * topLevelSku}).
 */
import { getProductLink, rootLink } from '../../core/routes.js';

/**
 * Construye la URL de producto desde cualquiera de las formas de item que
 * devuelven los dropins (cart item, order item, search result, wishlist…).
 * @param {object} item
 * @returns {string} URL del producto, o '#' localizado si faltan datos
 */
export function productLinkFromItem(item) {
  const urlKey = item?.url?.urlKey ?? item?.urlKey;
  const sku = item?.topLevelSku ?? item?.sku;

  if (!urlKey || !sku) {
    return rootLink('#');
  }
  return getProductLink(urlKey, sku);
}
