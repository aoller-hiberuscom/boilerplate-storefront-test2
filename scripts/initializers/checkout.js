/**
 * @deprecated Shim de compatibilidad con blocks aún no migrados.
 * En código nuevo, declarar la dependencia con:
 *   import { ensureCapability } from '../dropins/registry.js';
 *   await ensureCapability('checkout');
 */
import { ensureCapability } from '../dropins/registry.js';

await ensureCapability('checkout');
