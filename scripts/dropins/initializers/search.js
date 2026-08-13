/**
 * Initializer del dropin de Product Discovery (search).
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-product-discovery/api.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'catalogService',
  placeholders: 'placeholders/search.json',
});
