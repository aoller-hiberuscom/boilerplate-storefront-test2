/**
 * domain/product.js — Helpers de dominio de producto (SKU, plantillas PDP).
 *
 * Capa: domain (solo puede importar de core y vendor).
 */
import { getMetadata, readBlockConfig } from '../aem.js';
import { getRootPath } from '../core/config.js';
import { IS_UE, IS_DA } from '../core/env.js';
import { logger } from '../core/logger.js';

/**
 * Product template paths - pages that are templates and should use
 * default/fake SKUs. Relative to root path, ie "/", "/fr/", etc.
 */
export const PRODUCT_TEMPLATE_PATHS = [
  'products/default',
];

/**
 * Extracts the SKU from the current URL path.
 * @returns {string|undefined} The SKU extracted from the URL
 */
function getSkuFromUrl() {
  const path = window.location.pathname;
  const result = path.match(/\/products\/[\w|-]+\/([\w|-]+)$/);
  return result?.[1];
}

/**
 * Extracts the defaultSku property from the product-details block element.
 * @returns {string|null} The defaultSku value from the block, or null if not found
 */
function getDefaultSkuFromBlock() {
  const productDetailsBlock = document.querySelector('.product-details.block');
  if (!productDetailsBlock) {
    logger.warn('No product-details block found');
    return null;
  }

  const config = readBlockConfig(productDetailsBlock);
  if (!config.defaultsku) {
    logger.warn('No defaultSku found in product-details block');
    return null;
  }
  return config.defaultsku;
}

/**
 * Checks if the current page is a product template page.
 * @returns {boolean} True if the current page matches a product template path
 */
export function isProductTemplate() {
  const root = getRootPath();
  const { pathname } = window.location;

  return PRODUCT_TEMPLATE_PATHS.some((templatePath) => {
    const fullPath = root ? `${root}${templatePath}` : templatePath;
    return pathname === fullPath || pathname === fullPath.replace(/\/$/, '');
  });
}

/**
 * Gets the product SKU from metadata or URL fallback.
 * @returns {string|null|undefined} The SKU, or null/undefined if not found
 */
export function getProductSku() {
  if (isProductTemplate() && (IS_UE || IS_DA)) {
    return getDefaultSkuFromBlock();
  }

  return getMetadata('sku') || getSkuFromUrl();
}

/**
 * Extracts option UIDs from the URL search parameters.
 * @returns {string[]|undefined} Array of option UIDs, or undefined if not found
 */
export function getOptionsUIDsFromUrl() {
  return new URLSearchParams(window.location.search).get('optionsUIDs')?.split(',');
}
