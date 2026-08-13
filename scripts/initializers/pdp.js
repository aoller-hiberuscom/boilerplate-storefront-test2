/**
 * @deprecated Shim de compatibilidad con blocks aún no migrados.
 * En código nuevo, declarar la dependencia con:
 *   import { ensureCapability } from '../dropins/registry.js';
 *   await ensureCapability('pdp');
 * e importar IMAGES_SIZES desde '../dropins/initializers/pdp.js'.
 */
import { ensureCapability } from '../dropins/registry.js';

export { IMAGES_SIZES } from '../dropins/initializers/pdp.js';

await ensureCapability('pdp');
