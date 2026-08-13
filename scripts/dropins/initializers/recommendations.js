/**
 * Initializer del dropin de Recommendations.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-recommendations/api.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'catalogService',
  placeholders: 'placeholders/recommendations.json',
});
