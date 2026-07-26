/**
 * Имя нового чата-задачи, пока пользователь не сказал, о чём он. Как только в
 * тред уходит первая реплика, `useAgentStream` заменяет его на тему из этой
 * реплики (`threadTitleFromMessage`) — список диалогов должен читаться как
 * список задач, а не как стопка «Новых разговоров».
 */
export const NEW_THREAD_TITLE = 'Новый разговор';

/** Максимальная длина заголовка — дальше обрезается по границе слова с многоточием. */
const MAX_LENGTH = 52;

/**
 * Тема чата из первой реплики пользователя: берётся первое предложение (до
 * `.`, `?`, `!` или перевода строки), схлопываются пробелы, снимается хвостовая
 * пунктуация, первая буква — заглавная.
 *
 * Пустая или бессмысленная строка (одни знаки препинания) даёт
 * `NEW_THREAD_TITLE` — переименовывать тред в пустоту хуже, чем оставить как есть.
 */
export function threadTitleFromMessage(text: string): string {
  const firstSentence = text.split(/[.!?\n]/)[0] ?? '';
  const normalized = firstSentence.replace(/\s+/g, ' ').trim().replace(/[\s,;:—–-]+$/, '');
  if (!normalized) return NEW_THREAD_TITLE;

  const capitalized = normalized[0]!.toLocaleUpperCase('ru-RU') + normalized.slice(1);
  if (capitalized.length <= MAX_LENGTH) return capitalized;

  const cut = capitalized.slice(0, MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  // Обрезаем по границе слова, но не отдаём огрызок короче половины лимита.
  const base = lastSpace > MAX_LENGTH / 2 ? cut.slice(0, lastSpace) : cut;
  // Хвостовой предлог или одинокая цифра перед многоточием («…цены с 2…»)
  // выглядят обрывком — отбрасываем их вместе с пунктуацией.
  return `${base.replace(/[\s,;:—–-]+$/, '').replace(/(?:\s+\S{1,2})+$/, '')}…`;
}
