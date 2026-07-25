/**
 * `failure` — честная ошибка внешнего источника (docs/SCENARIOS.md, §3.6).
 * Формулировка намеренно называет причину («сервис ЕГРЮЛ не отвечает») и
 * то, что именно не удалось — не безликое «что-то пошло не так»: это часть
 * продуктовой позиции («агент честен о своих пределах»).
 *
 * «Повтор проходит успешно» (§3.6) требует состояния между вызовами —
 * первое обращение к сценарию для конкретного треда падает ошибкой, любое
 * следующее (нажатие «Повторить» пересылает тот же ввод) — успешно.
 * Счётчик попыток живёт в module-scope `Map`, привязан к `threadId`: это
 * не React и не стор, а внутренняя деталь одного сценария, к границам
 * §5.3 («мок не знает про React/стор») не относится.
 */

import type { AgentContext, AgentEvent, Id } from '@/types/domain';
import { sleep } from '../timing';
import { failureErrorMessage, failureRetrySuccess } from './content';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['росреестр', 'егрюл', 'выписк'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

/** Число прошлых попыток на тред. Первая попытка (0) всегда падает. */
const attemptsByThread = new Map<Id, number>();

export async function* run(ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  const attempt = attemptsByThread.get(ctx.threadId) ?? 0;
  attemptsByThread.set(ctx.threadId, attempt + 1);

  yield { t: 'status', label: 'Запрашиваю сведения из ЕГРЮЛ' };
  await sleep(1500, signal);
  if (signal.aborted) return;

  if (attempt === 0) {
    yield { t: 'error', message: failureErrorMessage(), retryable: true };
    return;
  }

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  yield* streamTokens(failureRetrySuccess(), signal);
  if (signal.aborted) return;

  yield { t: 'done' };
}
