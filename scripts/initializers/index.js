/**
 * @deprecated Shim de compatibilidad. El arranque global de dropins vive
 * ahora en scripts/dropins/registry.js (bootGlobalDropins) y los helpers en
 * scripts/core/. Actualizar los imports en código nuevo:
 *   - getUserTokenCookie → scripts/core/auth.js
 *   - initializeDropin   → scripts/dropins/create-initializer.js
 */
import bootGlobalDropins from '../dropins/registry.js';

export { getUserTokenCookie } from '../core/auth.js';
export { initializeDropin } from '../dropins/create-initializer.js';

export default bootGlobalDropins;
