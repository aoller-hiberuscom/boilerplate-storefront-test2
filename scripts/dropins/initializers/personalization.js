/**
 * Initializer del dropin de Personalization.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-personalization/api.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'core',
});
