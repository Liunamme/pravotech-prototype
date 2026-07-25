/**
 * Генерация дат демо-сценариев (docs/SCENARIOS.md, §2, §5 и ТЗ 4a.7).
 *
 * «Сегодня» всегда берётся из `new Date()` в момент вызова — никаких
 * захардкоженных ISO-строк, чтобы демо не «протухало» при запуске в другой
 * день. Все сроки в сценариях считаются относительно этого момента через
 * `daysFromNow(n)` — ровно так, как заданы в SCENARIOS.md («завтра» → `1`,
 * «через 12 дней» → `12` и т. д.).
 *
 * Здесь — только генерация `IsoDateTime` и два минимальных числовых
 * форматтера, нужных, чтобы собрать читаемую фразу или ячейку таблицы
 * прямо в тексте сценария (см. `content.ts`). Это не замена
 * `shared/lib/date.ts`: там — форматирование для интерфейса (относительное
 * время, срочность, локаль); здесь — только генерация значений и то
 * минимальное «сырое» форматирование, без которого текст сценария
 * невозможно собрать (сценарий сам является текстом, не полем даты).
 */

import type { IsoDateTime } from '@/types/domain';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function timezoneOffset(date: Date): string {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/** Локальная дата/время → `IsoDateTime` с таймзоной среды выполнения. */
export function toIso(date: Date): IsoDateTime {
  const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  return `${datePart}T${timePart}${timezoneOffset(date)}`;
}

/** Момент вызова, как `IsoDateTime`. */
export function now(): IsoDateTime {
  return toIso(new Date());
}

/** `date`, но с временем, заданным строкой `'HH:mm'`. */
export function atTime(date: Date, hhmm: string): IsoDateTime {
  const parts = hhmm.split(':');
  const hours = Number(parts[0] ?? '0');
  const minutes = Number(parts[1] ?? '0');
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return toIso(next);
}

/**
 * `n` календарных дней от сегодня (может быть отрицательным — для дат
 * в прошлом, например «отзыв подан 5 дней назад»). Время по умолчанию —
 * рабочее утро `09:00`, если не передано другое.
 */
export function daysFromNow(n: number, hhmm = '09:00'): IsoDateTime {
  const base = new Date();
  base.setDate(base.getDate() + n);
  return atTime(base, hhmm);
}

const RU_MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const;

/**
 * «25 июля» — минимальная фраза для встраивания в прозу сценария.
 * Не путать с `shared/lib/date.ts`: там живёт вся логика для интерфейса
 * (относительные подписи, срочность, локализация); здесь — только то,
 * без чего нельзя собрать сам текст ответа агента.
 */
export function formatRuDay(iso: IsoDateTime): string {
  const date = new Date(iso);
  const month = RU_MONTHS_GENITIVE[date.getMonth()] ?? '';
  return `${date.getDate()} ${month}`;
}

/** «25.07.2026» — для ячеек табличного блока (`MessageBlock` типа `table`). */
export function formatDdMmYyyy(iso: IsoDateTime): string {
  const date = new Date(iso);
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}
