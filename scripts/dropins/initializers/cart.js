/**
 * Initializer del dropin de Cart.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-cart/api.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'core',
  placeholders: 'placeholders/cart.json',
});
