import {
  differenceInCalendarDays,
  format,
  formatRelative as formatRelativeFns,
} from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Единственная точка форматирования дат в проекте (SPEC 4: прямые вызовы
 * date-fns вне этого файла запрещены). Всё — с локалью ru.
 */

export type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/** «24 июля 2026» */
export function formatDate(input: DateInput): string {
  return format(toDate(input), 'd MMMM yyyy', { locale: ru });
}

/** «24 июля 2026, 14:30» */
export function formatDateTime(input: DateInput): string {
  return format(toDate(input), 'd MMMM yyyy, HH:mm', { locale: ru });
}

/** «вчера в 14:30», «в прошлый вторник в 09:00» и т.п. — относительно baseDate. */
export function formatRelative(input: DateInput, baseDate: DateInput = new Date()): string {
  return formatRelativeFns(toDate(input), toDate(baseDate), { locale: ru });
}

export type DeadlineUrgency = 'overdue' | 'today' | 'soon' | 'normal';

export type DeadlineInfo = {
  text: string;
  urgency: DeadlineUrgency;
};

const SOON_THRESHOLD_DAYS = 3;

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

/**
 * Человеко-читаемый срок + степень срочности для визуального кодирования
 * (используется в DeadlineTimeline, карточках, бейджах приоритета).
 */
export function formatDeadline(input: DateInput, now: DateInput = new Date()): DeadlineInfo {
  const date = toDate(input);
  const base = toDate(now);
  const daysDiff = differenceInCalendarDays(date, base);

  let urgency: DeadlineUrgency;
  if (daysDiff < 0) urgency = 'overdue';
  else if (daysDiff === 0) urgency = 'today';
  else if (daysDiff <= SOON_THRESHOLD_DAYS) urgency = 'soon';
  else urgency = 'normal';

  let text: string;
  if (urgency === 'overdue') {
    const daysLate = Math.abs(daysDiff);
    text = `Просрочено на ${daysLate} ${pluralDays(daysLate)}`;
  } else if (urgency === 'today') {
    text = 'Сегодня';
  } else if (daysDiff === 1) {
    text = 'Завтра';
  } else {
    text = `Через ${daysDiff} ${pluralDays(daysDiff)}`;
  }

  return { text, urgency };
}

/** «Пятница, 24 июля» — день недели + число, без относительных подстановок «Сегодня»/«Завтра». */
export function formatWeekdayDate(input: DateInput): string {
  const raw = format(toDate(input), 'EEEE, d MMMM', { locale: ru });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Заголовок группы дня в таймлайне сроков (docs/UX.md §5): «Сегодня» /
 * «Завтра» / «Пятница, 31 июля» — относительные подстановки только для
 * первых двух дней, дальше — день недели с числом.
 */
export function formatDayHeader(input: DateInput, baseDate: DateInput = new Date()): string {
  const date = toDate(input);
  const base = toDate(baseDate);
  const days = differenceInCalendarDays(date, base);

  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  return formatWeekdayDate(date);
}
