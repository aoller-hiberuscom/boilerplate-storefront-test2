/**
 * Initializer del dropin de Auth.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import * as api from '@dropins/storefront-auth/api.js';
import { getAdobeCommerceOptimizerConfig } from '../../core/config.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  endpoint: 'core',
  placeholders: 'placeholders/auth.json',
  getProps: () => ({
    adobeCommerceOptimizer: getAdobeCommerceOptimizerConfig(),
  }),
});
