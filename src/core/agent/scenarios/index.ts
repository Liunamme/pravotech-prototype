/**
 * Реестр сценариев мок-агента (docs/SCENARIOS.md, §3) и точка выбора
 * сценария по вводу пользователя.
 *
 * Порядок в `SCENARIOS` совпадает с порядком §3.1–§3.7 документа — это и
 * есть требуемый порядок «специфичное раньше общего» (§3, вступление):
 * `fallback` совпадает всегда и обязан идти последним, иначе он забрал бы
 * себе все реплики раньше, чем до них дойдёт черёд.
 *
 * `run` каждого сценария объявлен как `(ctx, signal) => AsyncGenerator<...>`
 * (два параметра) — ровно так, как уже написаны `morningDigest`,
 * `autoRenewalScan`, `casePosition`. Тип `ScenarioRun` ниже требует третий
 * параметр, `input`; это безопасно и не требует правки уже готовых
 * сценариев — функция с меньшим числом объявленных параметров спокойно
 * подставляется на место типа с большим (лишний аргумент просто
 * игнорируется), а `fallback` — единственный сценарий, которому реально
 * нужен сырой текст пользователя, — использует все три.
 */

import type { AgentContext, AgentEvent } from '@/types/domain';
import * as autoRenewalScan from './autoRenewalScan';
import * as casePosition from './casePosition';
import * as clarify from './clarify';
import * as failure from './failure';
import * as fallback from './fallback';
import * as morningDigestModule from './morningDigest';
import * as priceIncreaseRefusal from './priceIncreaseRefusal';

export type ScenarioRun = (
  ctx: AgentContext,
  signal: AbortSignal,
  input: string,
) => AsyncGenerator<AgentEvent>;

export type Scenario = {
  id: string;
  match: (input: string) => boolean;
  run: ScenarioRun;
};

const MORNING_DIGEST: Scenario = {
  id: 'morningDigest',
  match: morningDigestModule.match,
  run: morningDigestModule.run,
};
const AUTO_RENEWAL_SCAN: Scenario = {
  id: 'autoRenewalScan',
  match: autoRenewalScan.match,
  run: autoRenewalScan.run,
};
const CASE_POSITION: Scenario = {
  id: 'casePosition',
  match: casePosition.match,
  run: casePosition.run,
};
const PRICE_INCREASE_REFUSAL: Scenario = {
  id: 'priceIncreaseRefusal',
  match: priceIncreaseRefusal.match,
  run: priceIncreaseRefusal.run,
};
const CLARIFY: Scenario = { id: 'clarify', match: clarify.match, run: clarify.run };
const FAILURE: Scenario = { id: 'failure', match: failure.match, run: failure.run };
const FALLBACK: Scenario = { id: 'fallback', match: fallback.match, run: fallback.run };

/** Реестр в порядке подбора — см. комментарий файла. */
export const SCENARIOS: readonly Scenario[] = [
  MORNING_DIGEST,
  AUTO_RENEWAL_SCAN,
  CASE_POSITION,
  PRICE_INCREASE_REFUSAL,
  CLARIFY,
  FAILURE,
  FALLBACK,
];

/**
 * Подбирает сценарий по вводу — первый, чей `match` вернул `true`.
 * `ctx` пока не участвует в подборе (весь канон различим по тексту ввода),
 * но входит в сигнатуру намеренно: вызывающая сторона (`mockTransport`)
 * обязана иметь его под рукой в любом случае, чтобы передать в `run()`, и
 * будущие сценарии вполне могут захотеть маршрутизировать по пространству
 * или состоянию треда, не меняя сигнатуру ещё раз.
 */
export function getScenario(input: string, _ctx: AgentContext): Scenario {
  return SCENARIOS.find((scenario) => scenario.match(input)) ?? FALLBACK;
}

/**
 * Отдельный именованный экспорт для прямого автозапуска при первом
 * открытии «Сегодня» в сессии — минуя `getScenario`/подбор по тексту
 * (см. заголовочный комментарий `morningDigest.ts`).
 */
export const morningDigest = MORNING_DIGEST;
