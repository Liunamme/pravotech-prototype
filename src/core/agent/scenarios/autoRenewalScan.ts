/**
 * `autoRenewalScan` — сканирование портфеля на автопролонгации
 * (docs/SCENARIOS.md, §3.2). Витрина честной латентности: полоса прогресса
 * должна двигаться заметно, шаг за шагом, а не скачком — это ключевой
 * момент демо, поэтому шаги эмитятся по одному через `for`, а не одним
 * `progress`-событием в конце.
 */

import type { AgentContext, AgentEvent } from '@/types/domain';
import { jitter, sleep, TIMING } from '../timing';
import { buildRenewal203Card, buildRenewal27Card, buildRenewal44Card } from './cards';
import { autoRenewalScanIntro, autoRenewalScanOutro } from './content';
import { daysFromNow, formatDdMmYyyy } from './dates';
import { COUNTERPARTY, srcLeaseRenewal, srcServices27Renewal, srcSupply203Renewal } from './refs';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['автопролонга', 'продлятся', 'пролонгация', 'портфел'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

export async function* run(ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Отбираю договоры с условием об автопролонгации' };
  await sleep(1200, signal);
  if (signal.aborted) return;

  const total = 12;
  for (let done = 0; done <= total; done++) {
    if (signal.aborted) return;
    yield { t: 'status', label: 'Читаю договоры', progress: { done, total } };
    if (done < total) {
      await sleep(jitter(650, 100), signal);
      if (signal.aborted) return;
    }
  }

  yield { t: 'status', label: 'Сверяю сроки уведомления с календарём' };
  await sleep(900, signal);
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  yield* streamTokens(autoRenewalScanIntro(), signal);
  if (signal.aborted) return;

  const renewal44 = daysFromNow(50);
  const notice44 = daysFromNow(1);
  const renewal27 = daysFromNow(53);
  const notice27 = daysFromNow(23);
  const renewal203 = daysFromNow(58);
  const notice203 = daysFromNow(28);

  yield {
    t: 'block',
    block: {
      type: 'table',
      head: ['Договор', 'Контрагент', 'Пролонгация', 'Уведомить до'],
      rows: [
        ['№44-АР', COUNTERPARTY.PRIME_RETAIL, formatDdMmYyyy(renewal44), formatDdMmYyyy(notice44)],
        ['№27-У', COUNTERPARTY.SOKOLOV, formatDdMmYyyy(renewal27), formatDdMmYyyy(notice27)],
        ['№203/П', COUNTERPARTY.SLA, formatDdMmYyyy(renewal203), formatDdMmYyyy(notice203)],
      ],
      citations: [srcLeaseRenewal(), srcServices27Renewal(), srcSupply203Renewal()],
    },
  };
  if (signal.aborted) return;

  yield* streamTokens(autoRenewalScanOutro(), signal);
  if (signal.aborted) return;

  const cards = [
    buildRenewal44Card(ctx.threadId),
    buildRenewal27Card(ctx.threadId),
    buildRenewal203Card(ctx.threadId),
  ];

  for (const card of cards) {
    await sleep(TIMING.cardRevealDelay, signal);
    if (signal.aborted) return;
    yield { t: 'card', card };
  }

  yield { t: 'done' };
}
