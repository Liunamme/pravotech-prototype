/**
 * `priceIncreaseRefusal` — работа с письмом контрагента о повышении цены
 * (docs/SCENARIOS.md, §3.4). Короткий сценарий (~4 s): читает письмо
 * «Вектора», сверяет его с договором поставки №118/П и делает вывод, что
 * одностороннее изменение цены Поставщиком не предусмотрено — отвечает
 * карточкой `obligation_breach` (P1) с проектом отказа.
 */

import type { AgentContext, AgentEvent } from '@/types/domain';
import { sleep, TIMING } from '../timing';
import { buildVektorPriceCard } from './cards';
import { priceIncreaseRefusalResult } from './content';
import { daysFromNow, formatRuDay } from './dates';
import { srcLetterVektorClaim, srcSupply118Delivery } from './refs';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['вектор', 'цен', 'повышени', 'отказ'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

export async function* run(ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Читаю письмо «Вектора»' };
  await sleep(900, signal);
  if (signal.aborted) return;

  yield { t: 'status', label: 'Сверяю условия договора поставки №118/П' };
  await sleep(900, signal);
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  // «1 сентября» — та же точка отсчёта (39 дней от сегодня), что и в
  // `morningDigest`: там и здесь фраза описывает одно и то же требование
  // «Вектора», даты обязаны совпадать.
  const priceDay = formatRuDay(daysFromNow(39));
  yield* streamTokens(priceIncreaseRefusalResult({ priceDay }), signal);
  if (signal.aborted) return;

  yield { t: 'citation', ref: srcLetterVektorClaim() };
  yield { t: 'citation', ref: srcSupply118Delivery() };

  await sleep(TIMING.cardRevealDelay, signal);
  if (signal.aborted) return;
  yield { t: 'card', card: buildVektorPriceCard(ctx.threadId) };

  yield { t: 'done' };
}
