/**
 * Проверка собранного CSS: не потерялось ли стандартное свойство рядом с
 * вендорным.
 *
 * Зачем отдельная проверка. Минификатор CSS (lightningcss внутри Vite) считает
 * `-webkit-backdrop-filter` алиасом `backdrop-filter` и схлопывает пару в одно
 * объявление — остаётся ПОСЛЕДНЕЕ. Мы писали стандартное свойство первым, а
 * вендорное вторым, поэтому из сборки выживало только `-webkit-`: в Chrome и
 * Firefox всё матовое стекло переставало размываться.
 *
 * Поймать это ни типами, ни юнит-тестами нельзя: в dev-режиме CSS не
 * минифицируется, и на `npm run dev` всё выглядит правильно. Ошибка рождается
 * ровно на сборке — значит и проверять надо результат сборки.
 *
 * Правило простое: на каждое `-webkit-foo` в собранном файле обязано найтись
 * `foo`. Обратное неверно — часть свойств вендорного варианта не требует.
 *
 * Запуск: `npm run check:dist` (после `npm run build`).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST_ASSETS = 'dist/assets';

/** Свойства, у которых вендорный вариант живёт сам по себе — пары не требуют. */
const VENDOR_ONLY = new Set([
  '-webkit-line-clamp',
  '-webkit-box-orient',
  '-webkit-font-smoothing',
  '-webkit-tap-highlight-color',
  '-webkit-overflow-scrolling',
  '-webkit-text-size-adjust',
  '-webkit-appearance',
]);

function readBundledCss(): { name: string; code: string } {
  let files: string[];
  try {
    files = readdirSync(DIST_ASSETS).filter((f) => f.endsWith('.css'));
  } catch {
    throw new Error(`Нет каталога ${DIST_ASSETS}. Сначала выполните "npm run build".`);
  }
  if (files.length === 0) throw new Error(`В ${DIST_ASSETS} нет ни одного .css — сборка неполная?`);

  return {
    name: files.join(', '),
    code: files.map((f) => readFileSync(join(DIST_ASSETS, f), 'utf8')).join('\n'),
  };
}

function main(): void {
  const { name, code } = readBundledCss();

  // Только позиция объявления: после `{` или `;`. Иначе под шаблон попадают
  // вендорные псевдоэлементы вроде `::-webkit-scrollbar-thumb`, у которых
  // стандартной пары не существует в принципе.
  const prefixed = new Set(Array.from(code.matchAll(/[;{]\s*-webkit-([a-z-]+)\s*:/g), (m) => m[1]!));
  const problems: string[] = [];

  for (const property of prefixed) {
    if (VENDOR_ONLY.has(`-webkit-${property}`)) continue;
    // Ищем стандартное свойство: перед ним не должно быть дефиса (иначе
    // совпадёт сам вендорный вариант).
    const standalone = new RegExp(`[;{]\\s*${property}\\s*:`);
    if (!standalone.test(code)) {
      problems.push(
        `  -webkit-${property} есть, а стандартного ${property} нет.\n` +
          `    Скорее всего, в исходном CSS стандартное свойство написано ПЕРЕД вендорным —\n` +
          `    минификатор схлопывает пару и оставляет последнее. Порядок должен быть:\n` +
          `      -webkit-${property}: …;\n` +
          `      ${property}: …;`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(`✗ Собранный CSS (${name}) потерял стандартные свойства:\n`);
    console.error(problems.join('\n\n'));
    process.exit(1);
  }

  console.log(`✓ Собранный CSS (${name}): все ${prefixed.size} вендорных свойств идут в паре со стандартными.`);
}

main();
