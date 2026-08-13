/**
 * Initializer del dropin de Payment Services.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 */
import { initializers } from '@dropins/tools/initializer.js';
import * as api from '@dropins/storefront-payment-services/api.js';
import { getCoreEndpoint, getHeaders } from '../../core/config.js';
import { getUserTokenCookie } from '../../core/auth.js';
import { createDropinInitializer } from '../create-initializer.js';

export default createDropinInitializer({
  api,
  placeholders: 'placeholders/payment-services.json',
  mount: ({ langDefinitions }) => initializers.mountImmediately(api.initialize, {
    apiUrl: getCoreEndpoint(),
    getCustomerToken: getUserTokenCookie,
    storeViewCode: getHeaders('payment-services').Store,
    langDefinitions,
  }),
});
