/**
 * `createMockTransport()` — реализация `AgentTransport` поверх сценариев
 * `core/agent/scenarios/*` (docs/SCENARIOS.md, §5).
 *
 * Единственное место, где сценарий получает настоящий `AbortSignal`:
 * `send()` заводит на тред `AbortController`, `cancel()` его прерывает.
 * Сценарии — асинхронные генераторы, которые сами проверяют `signal`
 * между шагами и внутри `streamTokens` (`scenarios/stream.ts`) и
 * завершаются через `return`, а не `throw` — поэтому отмена не выглядит
 * как ошибка ни для потребителя потока, ни для `finally` ниже.
 *
 * Файл не импортирует React, стор или `shared/ui` — чистая функция от
 * `AgentTransport`, взаимозаменяемая с будущим SSE-клиентом
 * (`core/agent/transport.ts`, из этапа 3).
 */

import type { AgentContext, AgentEvent, AgentTransport, Id } from '@/types/domain';
import { getScenario, type Scenario } from './scenarios';

export function createMockTransport(): AgentTransport {
  /** Активный контроллер на тред. Максимум один поток на тред одновременно. */
  const controllers = new Map<Id, AbortController>();

  function send(input: string, ctx: AgentContext): AsyncIterable<AgentEvent> {
    // Если на этот тред уже идёт поток (например, вызвали send() до
    // получения `done` от предыдущего) — он честно прерывается, а не
    // продолжает крутиться параллельно новому.
    controllers.get(ctx.threadId)?.abort();

    const controller = new AbortController();
    controllers.set(ctx.threadId, controller);

    const scenario = getScenario(input, ctx);
    return stream(scenario, ctx, input, controller);
  }

  async function* stream(
    scenario: Scenario,
    ctx: AgentContext,
    input: string,
    controller: AbortController,
  ): AsyncGenerator<AgentEvent> {
    try {
      yield* scenario.run(ctx, controller.signal, input);
    } finally {
      // Снимаем запись, только если это всё ещё «наш» контроллер — новый
      // send() на тот же тред мог уже его заменить своим.
      if (controllers.get(ctx.threadId) === controller) {
        controllers.delete(ctx.threadId);
      }
    }
  }

  function cancel(threadId: Id): void {
    controllers.get(threadId)?.abort();
  }

  return { send, cancel };
}
