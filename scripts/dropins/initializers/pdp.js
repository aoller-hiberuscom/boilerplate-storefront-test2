/**
 * Initializer del dropin de PDP (Product Detail Page).
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js (byPageType) o el
 * block product-details vía ensureCapability('pdp').
 *
 * Nota: corrige el bug del boilerplate en el que `isAemAssetsEnabled` se
 * evaluaba como referencia (siempre truthy) en lugar de invocarse.
 */
import { initializers } from '@dropins/tools/initializer.js';
import { Image, provider as UI } from '@dropins/tools/components.js';
import * as api from '@dropins/storefront-pdp/api.js';
import { isAemAssetsEnabled, tryGenerateAemAssetsOptimizedUrl } from '@dropins/tools/lib/aem/assets.js';
import { getMetadata } from '../../aem.js';
import { createDropinInitializer } from '../create-initializer.js';
import { IS_UE } from '../../core/env.js';
import { logger } from '../../core/logger.js';
import { preloadFile } from '../../core/content.js';
import { loadErrorPage } from '../../core/error.js';
import { fetchPlaceholders } from '../../core/i18n.js';
import { getProductSku, getOptionsUIDsFromUrl } from '../../domain/product.js';

export const IMAGES_SIZES = {
  width: 960,
  height: 1191,
};

/**
 * Extracts the main product image URL from JSON-LD or meta tags.
 * @returns {string|null} The image URL or null if not found
 */
function extractMainImageUrl() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return getMetadata('og:image') || getMetadata('image');
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);

    // Verify this is product structured data before extracting image
    if (jsonLd?.['@type'] === 'Product' && jsonLd?.image) {
      return jsonLd.image;
    }

    return getMetadata('og:image') || getMetadata('image');
  } catch (error) {
    logger.debug('Failed to parse JSON-LD:', error);
    return getMetadata('og:image') || getMetadata('image');
  }
}

/** Preloads PDP dropin assets for optimal performance. */
function preloadPDPAssets() {
  [
    'api.js',
    'render.js',
    'containers/ProductHeader.js',
    'containers/ProductPrice.js',
    'containers/ProductShortDescription.js',
    'containers/ProductOptions.js',
    'containers/ProductQuantity.js',
    'containers/ProductDescription.js',
    'containers/ProductAttributes.js',
    'containers/ProductGallery.js',
  ].forEach((file) => preloadFile(`/scripts/__dropins__/storefront-pdp/${file}`, 'script'));

  // Extract and preload main product image
  const imageUrl = extractMainImageUrl();

  if (imageUrl) {
    preloadFile(imageUrl, 'image');
  } else {
    logger.warn('Unable to infer main image from JSON-LD or meta tags');
  }
}

async function preloadImageMiddleware(data) {
  const image = data?.images?.[0]?.url?.replace(/^https?:/, '');

  if (image) {
    let url = image;
    /** @type {Record<string, unknown>} */
    let imageParams = {
      ...IMAGES_SIZES,
    };
    if (isAemAssetsEnabled()) {
      url = tryGenerateAemAssetsOptimizedUrl(image, data.sku, {});
      imageParams = {
        ...imageParams,
        crop: undefined,
        fit: undefined,
        auto: undefined,
      };
    }
    await UI.render(Image, {
      src: url,
      ...IMAGES_SIZES.mobile,
      params: imageParams,
      loading: 'eager',
    })(document.createElement('div'));
  }
  return data;
}

export default createDropinInitializer({
  api,
  endpoint: 'catalogService',
  mount: async () => {
    // Preload PDP assets as soon as the capability is requested
    preloadPDPAssets();

    const sku = getProductSku();
    const optionsUIDs = getOptionsUIDsFromUrl();

    // If we cannot find a sku, and we are not in UE, there's a problem.
    if (!sku && !IS_UE) {
      await loadErrorPage();
      return;
    }

    const [product, labels] = await Promise.all([
      api.fetchProductData(sku, { optionsUIDs, skipTransform: true }).then(preloadImageMiddleware),
      fetchPlaceholders('placeholders/pdp.json'),
    ]);

    const langDefinitions = {
      default: {
        ...labels,
      },
    };

    const models = {
      ProductDetails: {
        initialData: { ...product },
      },
    };

    await initializers.mountImmediately(api.initialize, {
      sku,
      optionsUIDs,
      langDefinitions,
      models,
      acdl: true,
      persistURLParams: true,
    });
  },
});
