import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Тесты — на логике, а не на разметке: валидация карточек, часовые пояса
 * сроков, машина состояний решения, темы тредов, идентификаторы, сбои
 * транспорта, порядок очереди. Всё это чистые модули, поэтому среда — node,
 * без jsdom и без React Testing Library: рендер компонентов и сквозные
 * сценарии проверяются вручную и Playwright-скриптами (см. README).
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
