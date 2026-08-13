/**
 * blocks/product-details/gallery.js — Galería del PDP: configs y slots de imagen.
 *
 * Responsabilidad: declarar la configuración de la galería (mobile y desktop
 * derivadas de una base común, con sus diferencias explícitas: controls/peak)
 * y los slots de imagen AEM Assets usados por la galería y por los swatches
 * de ProductOptions.
 */
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { renderImageSlot } from '../../scripts/ui/slots/image-slot.js';
import { IMAGES_SIZES } from '../../scripts/dropins/initializers/pdp.js';

/**
 * Slot de imagen de swatch (ProductOptions): imagen del asset con alias sku,
 * envuelta en un <span>.
 * @param {object} ctx Contexto del slot del dropin (data, defaultImageProps…)
 */
export function swatchImageSlot(ctx) {
  renderImageSlot(ctx, { alias: ctx.data.sku });
}

/**
 * Slots de la galería (compartidos por las variantes mobile y desktop).
 * - CarouselThumbnail: imagen envuelta en <span> (patrón común, ui/slots).
 * - CarouselMainImage: sin wrapper — difiere de renderImageSlot (que siempre
 *   envuelve en <span>), por lo que mantiene la llamada específica.
 */
export const gallerySlots = {
  CarouselThumbnail: (ctx) => {
    if (ctx.mediaType === 'image') {
      renderImageSlot(ctx, { alias: ctx.data.sku });
    }
  },

  CarouselMainImage: (ctx) => {
    if (ctx.mediaType === 'image') {
      const { data, defaultImageProps } = ctx;
      tryRenderAemAssetsImage(ctx, {
        alias: data.sku,
        imageProps: defaultImageProps,

        params: {
          width: defaultImageProps.width,
          height: defaultImageProps.height,
        },
      });
    }
  },
};

/** Config base común a ambas galerías. Factoría para no compartir referencias. */
const baseGalleryConfig = () => ({
  arrows: true,
  gap: 'small',
  loop: false,
  videos: true, // Display videos if available
  imageParams: {
    ...IMAGES_SIZES,
  },

  slots: gallerySlots,
});

/**
 * Configuraciones de la galería del PDP, derivadas de la base común.
 * Diferencias explícitas entre variantes: controls y peak.
 * @returns {{ mobile: object, desktop: object }} Props para ProductGallery
 */
export function getGalleryConfigs() {
  return {
    mobile: {
      ...baseGalleryConfig(),
      controls: 'dots',
      peak: false,
    },
    desktop: {
      ...baseGalleryConfig(),
      controls: 'thumbnailsColumn',
      peak: true,
    },
  };
}
