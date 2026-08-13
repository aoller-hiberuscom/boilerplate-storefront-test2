/**
 * Configuración de Vitest (unit tests).
 *
 * - environment jsdom: los módulos de core/ui tocan DOM/window.
 * - alias @dropins/*: replica el importmap de head.html para que los módulos
 *   resuelvan contra scripts/__dropins__/ igual que en el navegador.
 * - Solo dev: este fichero y test/ están excluidos del publish (.hlxignore).
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@dropins\//,
        replacement: fileURLToPath(new URL('./scripts/__dropins__/', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.js'],
    restoreMocks: true,
  },
});
