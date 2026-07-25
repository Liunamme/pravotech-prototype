/**
 * `fallback` — сценарий по умолчанию, когда ни один другой не подошёл
 * (docs/SCENARIOS.md, §3.7). `match` совпадает всегда — в реестре
 * (`index.ts`) стоит последним, поэтому реально срабатывает только если
 * ничего специфичнее не совпало раньше.
 *
 * Никогда не выглядит заглушкой: ищет в вводе пользователя знакомую по
 * канону (`refs.ts`) тему и, если находит, отвечает предметно — с одной
 * ссылкой на подходящий документ (`fallbackWithContext`). Если тема не
 * узнана, честно называет, что умеет в этом пространстве, вместо того
 * чтобы придумывать несуществующий ответ (`fallbackGeneric`).
 *
 * `input` сюда приходит третьим параметром `run()` — единственный сценарий
 * из семи, которому нужен сырой текст пользователя (остальные отвечают
 * фиксированным по смыслу содержанием независимо от формулировки ввода).
 */

import type { AgentContext, AgentEvent, SourceRef, ThreadScope } from '@/types/domain';
import { sleep } from '../timing';
import { fallbackGeneric, fallbackWithContext } from './content';
import { WORKSPACE } from './refs';
import {
  srcA40RulingEvidence,
  srcA40Subject,
  srcA41Subject,
  srcLeaseRenewal,
  srcNda09Term,
  srcPractice14,
  srcServices27Price,
  srcSupply118Delivery,
  srcSupply203Quality,
} from './refs';
import { streamTokens, thinkBeforeFirstToken } from './stream';

export function match(_input: string): boolean {
  return true;
}

/**
 * Известны только два реальных рабочих пространства канона (§2). Всё
 * остальное — в первую очередь `TODAY_SCOPE` ('today', тред «Сегодня») —
 * закрывается запасным вариантом ниже: строкового литерала `'today'` из
 * доменного типа здесь достаточно, отдельный value-импорт константы не
 * заводим (в `core/agent/**` нет ни одного рантайм-импорта значений из
 * `@/types/domain` — только `import type`; см. остальные файлы сценариев).
 */
const WORKSPACE_LABEL: Record<string, string> = {
  [WORKSPACE.OBLIGATIONS]: 'Обязательства по договорам',
  [WORKSPACE.LITIGATION]: 'Судебные дела',
};

function resolveWorkspaceLabel(workspaceId: ThreadScope): string {
  return WORKSPACE_LABEL[workspaceId] ?? 'Сегодня';
}

type TopicEntry = { stems: string[]; label: string; source: () => SourceRef };

/**
 * Узнаваемые по вводу темы — намеренно узкий список, ровно по документам
 * канона (§2). Порядок важен так же, как в реестре сценариев: более
 * специфичные стемы (номер дела, конкретный договор) — раньше общих.
 */
const TOPICS: TopicEntry[] = [
  { stems: ['конфиденциальн', 'нда'], label: 'соглашению о конфиденциальности №09-К', source: srcNda09Term },
  { stems: ['203'], label: 'договору поставки №203/П', source: srcSupply203Quality },
  { stems: ['аренд', '44-ар', '44 ар'], label: 'договору аренды №44-АР', source: srcLeaseRenewal },
  { stems: ['услуг', '27-у', '27 у'], label: 'договору оказания услуг №27-У', source: srcServices27Price },
  { stems: ['постав', '118'], label: 'договору поставки №118/П', source: srcSupply118Delivery },
  { stems: ['доказательств'], label: 'истребованию доказательств по делу №А40-118742/2026', source: srcA40RulingEvidence },
  { stems: ['практик'], label: 'практике Верховного Суда РФ', source: srcPractice14 },
  { stems: ['а41', '9930'], label: 'делу №А41-9930/2026', source: srcA41Subject },
  { stems: ['а40', '118742', 'заседан', 'иск', 'дело'], label: 'делу №А40-118742/2026', source: srcA40Subject },
];

function findTopic(input: string): { label: string; ref: SourceRef } | null {
  const normalized = input.toLowerCase();
  for (const entry of TOPICS) {
    if (entry.stems.some((stem) => normalized.includes(stem))) {
      return { label: entry.label, ref: entry.source() };
    }
  }
  return null;
}

export async function* run(ctx: AgentContext, signal: AbortSignal, input: string): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Ищу, за что зацепиться в запросе' };
  await sleep(600, signal);
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  const topic = findTopic(input);

  if (topic) {
    yield* streamTokens(fallbackWithContext(topic.label), signal);
    if (signal.aborted) return;
    yield { t: 'citation', ref: topic.ref };
  } else {
    yield* streamTokens(fallbackGeneric(resolveWorkspaceLabel(ctx.workspaceId)), signal);
    if (signal.aborted) return;
  }

  yield { t: 'done' };
}
