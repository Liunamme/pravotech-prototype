/**
 * Проверка того, что юрист вписал в форму карточки, до того как решение
 * уйдёт в стор и в исполнение.
 *
 * Зачем: карточка — это юридически значимое действие (уведомление
 * контрагенту, платёж, ходатайство). До этой проверки форма принимала любую
 * строку — пустой текст уведомления, ноль вместо суммы, перечень
 * доказательств без единого пункта, — и всё это спокойно уходило в
 * `decide()` как «изменено юристом».
 *
 * Границы честности: это проверка ради интерфейса, а не защита. Настоящая
 * защита — те же правила на сервере, который берёт карточку по id, сверяет
 * арендатора, роль, состояние и допустимость перехода. Клиент лишь не даёт
 * отправить заведомо негодное и объясняет, что именно негодно
 * (см. «Ограничения прототипа» в README).
 *
 * Правила конкретного типа живут рядом с самим типом (`CardTypeDef.validate`
 * в `workspaces/*​/cards/*.tsx`) — ядро не знает про поля чужих payload и
 * знать не должно (docs/DOMAIN.md, раздел 8).
 */

import type { CardTypeDef, FieldErrors } from '@/workspaces/types';
import { isValidCalendarDate } from '@/shared/lib/isoDate';

/**
 * Лимиты длины и количества. Нужны и клиенту, и будущему API: молча обрезать
 * текст уведомления нельзя — юрист не заметит, что отправилось не то.
 */
export const FIELD_LIMITS = {
  /** Однострочные поля: контрагент, «что истребовать», «у кого». */
  line: 200,
  /** Тексты документов: уведомление, ответ, ходатайство. */
  text: 4000,
  /** Сколько пунктов можно добавить в перечень. */
  items: 20,
  /** Верхняя граница суммы платежа — триллион рублей. */
  amount: 1e12,
} as const;

/** Обязательный текст: непустой после `trim()` и не длиннее лимита. */
export function checkText(value: unknown, opts: { what: string; max: number }): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return `Заполните: ${opts.what}.`;
  if (value.trim().length > opts.max) return `Слишком длинно: не больше ${opts.max} символов.`;
  return undefined;
}

/**
 * Денежная сумма: конечное положительное число не больше лимита и не точнее
 * копейки.
 *
 * Пустое поле формы приходит сюда как `NaN` (осознанно: `Number('')` дало бы
 * `0`, то есть «платёж на ноль» вместо «сумму не вписали»).
 *
 * Точность считается через сравнение с копейками по допуску: `10.005 * 100`
 * в двоичной плавающей точке равно `1000.4999…`, поэтому прямое сравнение
 * округлений здесь ничего не ловит.
 */
export function checkAmount(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Укажите сумму.';
  if (value <= 0) return 'Сумма должна быть больше нуля.';
  if (value > FIELD_LIMITS.amount) return 'Сумма выглядит ошибочной — проверьте разряды.';

  const kopecks = value * 100;
  if (Math.abs(kopecks - Math.round(kopecks)) > 1e-6) return 'Не больше двух знаков после запятой.';
  return undefined;
}

/** Срок: строка домена `IsoDateTime`, указывающая на существующую дату. */
export function checkDeadline(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return 'Укажите дату.';
  if (!isValidCalendarDate(value.slice(0, 10))) return 'Такой даты нет в календаре.';
  return undefined;
}

/** Собирает только заполненные ошибки: `undefined` в результат не попадает. */
export function collectErrors(entries: Record<string, string | undefined>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(entries)) {
    if (message) errors[key] = message;
  }
  return errors;
}

/** Ключ общей ошибки формы — не относится ни к одному полю. */
export const FORM_ERROR_KEY = '_form';

/**
 * Единая точка перед `confirmEdit`. Сначала проверяет саму форму payload
 * (объект, а не строка/массив/null), потом отдаёт правила типу карточки.
 * Тип без `validate` считается непроверяемым — тогда действует только общая
 * проверка, и это осознанный компромисс: типы без формы правки
 * (`filing_deadline`, `hearing_prep`) редактировать нечем.
 */
export function validateCardDecision<P>(cardType: CardTypeDef<P>, payload: P): FieldErrors {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { [FORM_ERROR_KEY]: 'Данные карточки повреждены — обновите страницу.' };
  }
  return cardType.validate?.(payload) ?? {};
}

/** Есть ли хоть одна ошибка. */
export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
