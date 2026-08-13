/**
 * core/logger.js — Logging con niveles, silenciable en producción.
 *
 * Capa: core (solo puede importar de vendor y core).
 * Usar en lugar de console.* directo en el código propio: permite silenciar
 * el ruido en producción sin tocar cada llamada.
 */
import { IS_DEV } from './env.js';

/**
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {...unknown} args
 */
function log(level, ...args) {
  if (!IS_DEV && (level === 'debug' || level === 'info')) return;
  // eslint-disable-next-line no-console
  console[level]('[storefront]', ...args);
}

export const logger = {
  /** @param {...unknown} args */
  debug: (...args) => log('debug', ...args),
  /** @param {...unknown} args */
  info: (...args) => log('info', ...args),
  /** @param {...unknown} args */
  warn: (...args) => log('warn', ...args),
  /** @param {...unknown} args */
  error: (...args) => log('error', ...args),
};

export default logger;
