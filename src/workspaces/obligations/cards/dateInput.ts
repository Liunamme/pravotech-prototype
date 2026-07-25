/**
 * Мини-мост между `<input type="date">` (нужен только для примитивного
 * HTML-контрола) и `IsoDateTime` со временем/таймзоной (домен). Не путать с
 * `shared/lib/date.ts` — там форматирование для чтения (SPEC 4: прямые
 * вызовы `date-fns` вне того файла запрещены, но это ограничение про
 * `date-fns`, а не про нативный `Date`, которым здесь всё и обходится).
 *
 * Сохраняет исходное время суток при правке даты в `EditForm`, чтобы
 * «изменить срок» не тихо обнуляло часы карточки на полночь. Собственный
 * (не через `toISOString()`) сборщик строки — домен ожидает смещение вида
 * `+03:00` (docs/DOMAIN.md §1), а не суффикс `Z`.
 */
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function timezoneOffset(date: Date): string {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function toIso(date: Date): string {
  const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  return `${datePart}T${timePart}${timezoneOffset(date)}`;
}

export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** `dateInputValue` («YYYY-MM-DD») подставляется в `originalIso`, время суток сохраняется. */
export function withNewDate(originalIso: string, dateInputValue: string): string {
  const parts = dateInputValue.split('-').map(Number);
  const [year, month, day] = parts;
  if (!year || !month || !day) return originalIso;

  const next = new Date(originalIso);
  next.setFullYear(year, month - 1, day);
  return toIso(next);
}
