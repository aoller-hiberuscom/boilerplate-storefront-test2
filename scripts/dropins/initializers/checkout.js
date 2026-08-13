/**
 * Initializer del dropin de Checkout.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-checkout/api.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'core',
  placeholders: 'placeholders/checkout.json',
});
