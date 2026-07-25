/**
 * `morningDigest` — утренний дайджест (docs/SCENARIOS.md, §3.1).
 *
 * Два пути запуска: (1) слово «дайджест» в обычном вводе — через подбор
 * сценария (`match`, `getScenario` в `index.ts`); (2) автоматически при
 * первом открытии «Сегодня» в сессии — этот путь не идёт через подбор по
 * тексту вовсе, вызывающий код (`TodayPage`, этап 7) вызывает `run()` этого
 * модуля напрямую через именованный экспорт `morningDigest` из `index.ts`.
 *

 * Каждое содержательное утверждение несёт `citation` — абзац без источника
 * здесь ошибка (§3.1, «Важно»). Четвёртый абзац (про №27-У и №203/П) в
 * исходном тексте SCENARIOS.md идёт без цитаты — это единственное
 * несоответствие «Важно»-правилу в документе; закрыл его цитатами на
 * `a-services-27-renewal`/`a-supply-203-renewal`, поскольку факты абзаца
 * ровно про них.
 */

import type { AgentContext, AgentEvent, SourceRef } from '@/types/domain';
import { sleep, statusStepDelay, TIMING } from '../timing';
import {
  buildFilingDeadlineCard,
  buildHearingPrepCard,
  buildRenewal44Card,
  buildVektorPriceCard,
} from './cards';
import { morningDigestSegments } from './content';
import { daysFromNow, formatRuDay } from './dates';
import {
  srcA40ResponseArg1,
  srcLeaseNotice,
  srcLeaseRenewal,
  srcLetterVektorClaim,
  srcServices27Renewal,
  srcSupply118Delivery,
  srcSupply203Renewal,
} from './refs';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['дайджест'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

export async function* run(ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Собираю картину дня' };
  await sleep(900, signal);
  if (signal.aborted) return;

  yield { t: 'status', label: 'Проверяю сроки по 2 пространствам', progress: { done: 1, total: 2 } };
  await sleep(statusStepDelay(), signal);
  if (signal.aborted) return;
  yield { t: 'status', label: 'Проверяю сроки по 2 пространствам', progress: { done: 2, total: 2 } };
  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  const segments = morningDigestSegments({
    leaseNoticeDay: formatRuDay(daysFromNow(1)),
    hearingDay: formatRuDay(daysFromNow(12)),
    responseDay: formatRuDay(daysFromNow(-5)),
    priceDay: formatRuDay(daysFromNow(39)),
  });

  const citationsBySegmentIndex: Record<number, SourceRef[]> = {
    1: [srcLeaseNotice()],
    2: [srcLeaseRenewal()],
    3: [srcA40ResponseArg1()],
    5: [srcLetterVektorClaim()],
    6: [srcSupply118Delivery()],
    7: [srcServices27Renewal(), srcSupply203Renewal()],
  };

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment === undefined) continue;
    yield* streamTokens(segment, signal);
    if (signal.aborted) return;
    for (const citation of citationsBySegmentIndex[i] ?? []) {
      yield { t: 'citation', ref: citation };
    }
  }

  const hearingAt = daysFromNow(12, '11:00');
  const cards = [
    buildRenewal44Card(ctx.threadId),
    buildHearingPrepCard(ctx.threadId, hearingAt),
    buildVektorPriceCard(ctx.threadId),
    buildFilingDeadlineCard(ctx.threadId),
  ];

  for (const card of cards) {
    await sleep(TIMING.cardRevealDelay, signal);
    if (signal.aborted) return;
    yield { t: 'card', card };
  }

  yield { t: 'done' };
}
