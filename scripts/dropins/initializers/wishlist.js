/**
 * Initializer del dropin de Wishlist.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-wishlist/api.js';
import { getHeaders } from '../../core/config.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'core',
  placeholders: 'placeholders/wishlist.json',
  getProps: () => ({
    isGuestWishlistEnabled: true,
    storeCode: getHeaders('wishlist').Store,
  }),
});
