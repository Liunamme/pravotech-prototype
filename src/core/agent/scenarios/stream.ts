/**
 * Общая механика потокового вывода текста, переиспользуемая всеми
 * сценариями — чтобы не дублировать цикл «токенизировать → отдать →
 * подождать → проверить отмену» в каждом файле сценария.
 */

import type { AgentEvent } from '@/types/domain';
import { firstTokenDelay, sleep, tokenDelay } from '../timing';
import { tokenize } from '../tokenize';

/**
 * Отдаёт `text` токен за токеном с задержками из `TIMING`. Между каждым
 * `sleep` и внутри него проверяется `signal` — отмена прерывает поток
 * между токенами, а не только между шагами сценария.
 */
export async function* streamTokens(text: string, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  const tokens = tokenize(text);
  for (const token of tokens) {
    if (signal.aborted) return;
    yield { t: 'token', text: token };
    if (signal.aborted) return;
    await sleep(tokenDelay(token), signal);
  }
}

/**
 * Пауза «агент думает» перед первым токеном ответа. Вызывается один раз
 * в начале сценария, до первого `streamTokens`.
 */
export async function thinkBeforeFirstToken(signal: AbortSignal): Promise<void> {
  await sleep(firstTokenDelay(), signal);
}
