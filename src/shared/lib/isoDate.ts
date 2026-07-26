/**
 * Мост между `<input type="date">` и `IsoDateTime` домена
 * (`'2026-07-24T09:15:00+03:00'`, docs/DOMAIN.md §1).
 *
 * ⚠️ Здесь намеренно НЕТ `new Date()` для разбора срока. Срок в карточке —
 * юридический факт, записанный в своём смещении (`+03:00`), а не момент
 * времени, который можно пересчитывать в часовой пояс читателя. Прежняя
 * реализация парсила строку через `Date`, правила локальные `setFullYear` и
 * собирала смещение из `getTimezoneOffset()` браузера: у юриста в
 * Калининграде или в командировке правка даты меняла сам момент и записывала
 * срок уже в чужом смещении, а на границе перехода на летнее время — ещё и со
 * сдвигом на час.
 *
 * Поэтому дата правится текстово: меняется только компонент `YYYY-MM-DD`,
 * время суток и исходное смещение остаются ровно теми, что пришли из данных.
 * Результат не зависит от часового пояса машины — см. `isoDate.test.ts`,
 * где одни и те же входы гоняются под Europe/Moscow, UTC и Pacific/Honolulu.
 */

/** `YYYY-MM-DD`, дальше — время и (необязательно) смещение либо `Z`. */
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})(T.*)?$/;

/** Только календарная дата, без времени: значение `<input type="date">`. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Существует ли такая дата в календаре. `2026-02-30` и `2026-13-01` разбор
 * регуляркой проходят, но означают несуществующий срок. Сверка идёт через
 * `Date.UTC` — в UTC нет переходов на летнее время, поэтому нормализация
 * компонентов однозначна и не зависит от машины.
 */
export function isValidCalendarDate(value: string): boolean {
  const match = DATE_ONLY.exec(value);
  if (!match) return false;

  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;

  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === m - 1 && utc.getUTCDate() === d;
}

/** Разбирает `IsoDateTime` на календарную дату и неизменяемый хвост (время + смещение). */
function splitIso(iso: string): { date: string; rest: string } | null {
  const match = ISO_DATE_TIME.exec(iso);
  if (!match) return null;

  const date = match[1]!;
  if (!isValidCalendarDate(date)) return null;
  return { date, rest: match[2] ?? '' };
}

/** Значение для `<input type="date">` — календарная дата в смещении самого срока. */
export function toDateInputValue(iso: string): string {
  return splitIso(iso)?.date ?? '';
}

/**
 * Подставляет новую календарную дату, сохраняя время суток и исходное
 * смещение. Некорректный ввод (пустой, несуществующая дата) не меняет ничего —
 * ошибку у поля показывает уже валидация карточки (`validateCardDecision`).
 */
export function withNewDate(originalIso: string, dateInputValue: string): string {
  const parsed = splitIso(originalIso);
  if (!parsed || !isValidCalendarDate(dateInputValue)) return originalIso;

  return `${dateInputValue}${parsed.rest}`;
}

/** Пригодна ли строка как значение срока: разбирается и указывает на существующую дату. */
export function isValidIsoDateTime(iso: string): boolean {
  return splitIso(iso) !== null;
}
