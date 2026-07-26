/**
 * Как показать сбой транспорта юристу.
 *
 * Мок-транспорт не бросает исключений — он либо доводит поток до `done`,
 * либо тихо останавливается по `cancel()`. Реальный SSE/fetch будет: сеть
 * отвалилась, истёк таймаут, пришёл HTTP 401/429/5xx, сломался формат
 * события. Раньше обход потока имел `try/finally` без `catch`, и любое такое
 * исключение выглядело как обычная остановка: placeholder закрывался в
 * `complete`, юрист видел оборванный ответ без причины и без «Повторить».
 *
 * Два правила:
 *
 * 1. **Отмена — не ошибка.** Прерванный `AbortController` бросает
 *    `AbortError`; это штатный сценарий кнопки «Стоп», сообщение о сбое
 *    здесь было бы враньём.
 * 2. **Наружу — только безопасный текст.** Сырое исключение может нести
 *    URL, заголовки, токен или ответ провайдера. Подробности уходят в
 *    консоль в dev, юристу достаётся объяснение и понятное действие.
 */

import type { Message } from '@/types/domain';

export type TransportFailure = NonNullable<Message['error']>;

/** Отмена прогона (кнопка «Стоп», уход со страницы), а не сбой. */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError');
}

/**
 * Безопасное описание сбоя. Все варианты `retryable`: транспортная ошибка не
 * означает, что запрос был негодным, — повтор осмыслен во всех случаях,
 * включая 401 (сессия могла обновиться) и 429 (лимит отпускает).
 */
export function describeTransportFailure(error: unknown): TransportFailure {
  if (import.meta.env.DEV) {
    console.error('[useAgentStream] сбой транспорта агента:', error);
  }

  // Отвалившаяся сеть в fetch приходит именно как TypeError.
  if (error instanceof TypeError) {
    return { message: 'Не удалось связаться с агентом. Проверьте соединение и повторите.', retryable: true };
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { message: 'Агент не ответил вовремя. Можно повторить.', retryable: true };
  }

  return { message: 'Агент прервался на полпути — ответ неполный. Можно повторить.', retryable: true };
}
