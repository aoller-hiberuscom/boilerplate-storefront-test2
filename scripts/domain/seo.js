/**
 * domain/seo.js — SEO: datos estructurados y metadatos.
 *
 * Capa: domain (solo puede importar de core y vendor).
 *
 * Incluye la generación de JSON-LD de producto (con su query de variantes) y
 * los meta tags de PDP, consumidos por blocks/product-details.
 */
import { getProductLink } from '../core/routes.js';
import { logger } from '../core/logger.js';

/**
 * Sets JSON-LD structured data in the document head.
 * @param {object} data - The JSON-LD data object
 * @param {string} name - The name identifier for the script element
 */
export function setJsonLd(data, name) {
  const existingScript = document.head.querySelector(`script[data-name="${name}"]`);
  if (existingScript) {
    existingScript.innerHTML = JSON.stringify(data);
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';

  script.innerHTML = JSON.stringify(data);
  script.dataset.name = name;
  document.head.appendChild(script);
}

/**
 * Checks if the page has prerendered product JSON-LD data.
 * @returns {boolean} True if product JSON-LD exists and declares a schema.org Product
 */
export function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    logger.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

/**
 * Genera y publica el JSON-LD de producto (schema.org/Product) con sus
 * ofertas: variantes si existen, u oferta única en caso contrario. Consulta
 * las variantes con el cliente GraphQL del dropin de PDP (Catalog Service);
 * el import es dinámico para no cargar el dropin fuera de páginas de PDP.
 * @param {object} product Producto (payload del evento pdp/data)
 * @returns {Promise<void>}
 */
export async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  const pdpApi = await import('@dropins/storefront-pdp/api.js');

  // get variants
  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            inStock
            images(roles: ["image"]) {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location.href),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location.href),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

/**
 * Crea, actualiza o elimina un meta tag del head.
 * @param {string} property Nombre/propiedad del meta tag
 * @param {*} content Contenido (si es falsy, el meta tag se elimina)
 * @param {string} type Tipo de atributo ('name' o 'property')
 */
function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/**
 * Publica los meta tags de PDP (title/description/keywords, Open Graph y
 * precio de producto) a partir del producto actual.
 * @param {object} product Producto (payload del evento pdp/data)
 */
export function setMetaTags(product) {
  if (!product?.sku) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}
