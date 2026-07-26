/**
 * Идентификаторы новых доменных записей.
 *
 * Раньше треды создавались как `thread-${workspace}-${Date.now()}` в трёх
 * местах. Два создания в одну миллисекунду (двойной клик по «+», подсказка
 * навыка сразу после создания треда, автоматизация) давали один и тот же id
 * — а в нормализованном сторе одинаковый ключ означает не «два треда», а
 * молча затёртую запись вместе со всей её перепиской.
 *
 * Время в доменном id не несёт смысла: порядок задаёт `createdAt`, а
 * читаемость — заголовок треда. Поэтому берётся случайный UUID.
 */

import type { Id } from '@/types/domain';

/**
 * `crypto.randomUUID` есть только в защищённом контексте (https или
 * localhost). Прототип открывают и по адресу вида `http://192.168.x.x:5199`
 * с телефона в той же сети — там метода нет, и падать из-за этого нельзя.
 * Запасной путь берёт те же криптостойкие байты и раскладывает их в форму
 * UUID v4.
 */
function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // версия 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // вариант RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** `newId('thread')` → `'thread-9f1c…'`. Префикс — только для читаемости в devtools. */
export function newId(prefix: string): Id {
  return `${prefix}-${randomUuid()}`;
}
