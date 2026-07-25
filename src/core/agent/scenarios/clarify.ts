/**
 * `clarify` — уточняющий вопрос при намеренно неоднозначном вводе
 * (docs/SCENARIOS.md, §3.5). Триггерные слова («расторг», «прекрат»)
 * подходят сразу трём договорам портфеля — агент честно уточняет, вместо
 * того чтобы гадать. Выбор одного из вариантов уходит в чат обычной
 * репликой пользователя и заново проходит через подбор сценария
 * (`getScenario`) — этот файл сам его не обрабатывает.
 */

import type { AgentContext, AgentEvent } from '@/types/domain';
import { sleep } from '../timing';
import { clarifyOptions, clarifyQuestion } from './content';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['расторг', 'прекрат'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

export async function* run(_ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Уточняю условие' };
  await sleep(700, signal);
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  const question = clarifyQuestion();
  yield* streamTokens(question, signal);
  if (signal.aborted) return;

  yield { t: 'clarify', question, options: [...clarifyOptions] };

  yield { t: 'done' };
}
