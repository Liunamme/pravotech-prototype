/**
 * `casePosition` — длинная операция с уходом в фон (docs/SCENARIOS.md, §3.3).
 * Самый важный сценарий для тезиса ТЗ о честной латентности: короткая
 * подготовка → `handoff` в `BackgroundTaskTray` → ~18 s фоновой работы →
 * итоговое сообщение с карточкой `hearing_prep` (P0).
 *
 * Технический нюанс контракта: `AgentTransport.send()` отдаёт один
 * непрерывный поток на реплику пользователя. `handoff` внутри этого потока
 * не завершает его — генератор продолжает эмитить `status` (с метками,
 * совпадающими с `task.steps`, чтобы фоновый трей мог их отследить) и
 * в конце — итоговые `token`/`citation`/`card`/`done`. Другого механизма
 * довести `BackgroundTask` до `succeeded` в domain-модели нет (`TaskEvent`
 * — отдельный канал для исполнения карточек, не для хэндоффа чата), так
 * что это единственная согласованная со схемой интерпретация.
 */

import type { AgentContext, AgentEvent, BackgroundTask } from '@/types/domain';
import { jitter, sleep, statusStepDelay, TIMING } from '../timing';
import { buildHearingPrepCard } from './cards';
import { casePositionCourtesyNote, casePositionResult } from './content';
import { daysFromNow, formatRuDay, now } from './dates';
import { TASK, WORKSPACE, srcA40ExpertConclusion, srcA40ResponseArg1, srcPractice14 } from './refs';
import { streamTokens, thinkBeforeFirstToken } from './stream';

const STEMS = ['позици', 'подготов', 'отзыв', 'возраж'];

export function match(input: string): boolean {
  const normalized = input.toLowerCase();
  return STEMS.some((stem) => normalized.includes(stem));
}

const BACKGROUND_STEP_LABELS = [
  'Анализ доводов отзыва',
  'Подбор практики ВС РФ',
  'Проверка срока исковой давности',
  'Сборка проекта возражений',
] as const;

export async function* run(ctx: AgentContext, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  yield { t: 'status', label: 'Изучаю материалы дела' };
  await sleep(1000, signal);
  if (signal.aborted) return;

  yield { t: 'status', label: 'Читаю отзыв ответчика', progress: { done: 1, total: 3 } };
  await sleep(statusStepDelay(), signal);
  if (signal.aborted) return;

  yield { t: 'status', label: 'Подбираю практику', progress: { done: 2, total: 3 } };
  await sleep(1400, signal);
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;
  yield* streamTokens(casePositionCourtesyNote(), signal);
  if (signal.aborted) return;

  const task: BackgroundTask = {
    id: TASK.CASE_POSITION_A40,
    workspaceId: WORKSPACE.LITIGATION,
    title: 'Подготовка позиции по делу №А40-118742/2026',
    state: 'running',
    steps: BACKGROUND_STEP_LABELS.map((label, index) => ({
      label,
      state: index === 0 ? 'active' : 'pending',
    })),
    progress: { done: 0, total: BACKGROUND_STEP_LABELS.length },
    startedAt: now(),
  };
  yield { t: 'handoff', task };
  if (signal.aborted) return;

  for (let index = 0; index < BACKGROUND_STEP_LABELS.length; index++) {
    if (signal.aborted) return;
    const label = BACKGROUND_STEP_LABELS[index];
    if (label === undefined) continue;
    yield { t: 'status', label, progress: { done: index, total: BACKGROUND_STEP_LABELS.length } };
    await sleep(jitter(2900, 900), signal);
    if (signal.aborted) return;
  }
  yield {
    t: 'status',
    label: 'Сборка проекта возражений',
    progress: { done: BACKGROUND_STEP_LABELS.length, total: BACKGROUND_STEP_LABELS.length },
  };
  if (signal.aborted) return;

  await thinkBeforeFirstToken(signal);
  if (signal.aborted) return;

  const hearingAt = daysFromNow(12, '11:00');
  yield* streamTokens(casePositionResult({ hearingDay: formatRuDay(hearingAt) }), signal);
  if (signal.aborted) return;

  yield { t: 'citation', ref: srcA40ResponseArg1() };
  yield { t: 'citation', ref: srcPractice14() };
  yield { t: 'citation', ref: srcA40ExpertConclusion() };

  await sleep(TIMING.cardRevealDelay, signal);
  if (signal.aborted) return;
  yield { t: 'card', card: buildHearingPrepCard(ctx.threadId, hearingAt) };

  yield { t: 'done' };
}
