/**
 * Сид карточек пространства «Дела» (этап 8, docs/SCENARIOS.md §4).
 *
 * Канонические карточки (`HEARING_A40`/`FILING_A40`) построены теми же
 * фабриками (`core/agent/scenarios/cards.ts`), что использует мок-агент в
 * `morningDigest`/`casePosition` — тот же `id`, тот же payload (docs/DOMAIN.md
 * §4: «одна карточка — одна запись»). `EVIDENCE_A40` и остальные карточки
 * этого файла не строятся ни одним сценарием — их `id` подобраны так, чтобы
 * не пересекаться с `CARD` из `refs.ts`.
 */
import type { ActionCard } from '@/types/domain';
import { buildFilingDeadlineCard, buildHearingPrepCard, type HearingPrepPayload } from '@/core/agent/scenarios/cards';
import {
  CARD,
  DOC,
  THREAD,
  srcA40RulingDate,
  srcA40RulingEvidence,
  srcA41Subject,
} from '@/core/agent/scenarios/refs';
import { daysFromNow, now } from '@/core/agent/scenarios/dates';
import type { EvidenceRequestPayload } from '../cards/evidenceRequest';
import type { FilingDeadlinePayload } from '@/core/agent/scenarios/cards';

/* ─────────────────────────────────  Ожидают решения  ────────────────────────────────── */

const evidenceA40Card: ActionCard<EvidenceRequestPayload> = {
  id: CARD.EVIDENCE_A40,
  workspaceId: 'litigation',
  type: 'evidence_request',
  priority: 'P1',
  title: 'Заявить ходатайство об истребовании доказательств',
  summary: 'Суд предложил ответчику представить документы по объёму поставки — нужно оформить ходатайство.',
  payload: {
    caseId: DOC.CASE_A40_CLAIM,
    caseNumber: '№А40-118742/2026',
    items: [
      { what: 'Акты приёма-передачи Товара за спорный период', from: 'ООО «Вектор»' },
      { what: 'Товарно-транспортные накладные по поставкам 2025 года', from: 'ООО «Вектор»' },
    ],
    motionText:
      'Прошу истребовать у Истца документы, подтверждающие факт и объём поставки Товара по Договору №118/П за' +
      ' спорный период, в соответствии с определением суда от 02.07.2026.',
    fileBy: daysFromNow(3),
  },
  sources: [srcA40RulingEvidence()],
  subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
  originThreadId: THREAD.LIT_A40_EVIDENCE,
  dueAt: daysFromNow(3),
  createdAt: now(),
  state: 'pending',
};

const hearingA41Card: ActionCard<HearingPrepPayload> = {
  id: 'card-hearing-a41',
  workspaceId: 'litigation',
  type: 'hearing_prep',
  priority: 'P2',
  title: 'Подготовиться к заседанию по делу А41-9930',
  summary: 'Предварительное заседание по спору об одностороннем отказе от исполнения договора.',
  payload: {
    caseNumber: '№А41-9930/2026',
    hearingAt: daysFromNow(20, '10:00'),
    summary: 'Позиция строится на подтверждении правомерности отказа от исполнения — материалы собираются.',
  },
  sources: [srcA41Subject()],
  subjectRef: { kind: 'case', id: DOC.CASE_A41_CLAIM, label: 'Дело №А41-9930/2026' },
  originThreadId: THREAD.LIT_A41,
  dueAt: daysFromNow(20, '10:00'),
  createdAt: now(),
  state: 'pending',
};

/* ─────────────────────────────────  Уже решённые (история)  ─────────────────────────── */

const evidenceInitialCard: ActionCard<EvidenceRequestPayload> = {
  id: 'card-lit-evidence-initial',
  workspaceId: 'litigation',
  type: 'evidence_request',
  priority: 'P2',
  title: 'Истребовать копию договора поставки из материалов дела',
  summary: 'Ходатайство подано и удовлетворено судом на подготовительной стадии.',
  payload: {
    caseId: DOC.CASE_A40_CLAIM,
    caseNumber: '№А40-118742/2026',
    items: [{ what: 'Заверенная копия Договора поставки №118/П со всеми приложениями', from: 'Арбитражный суд г. Москвы' }],
    motionText: 'Прошу приобщить к материалам дела заверенную копию Договора поставки №118/П со всеми приложениями.',
    fileBy: daysFromNow(-20),
  },
  sources: [srcA40RulingEvidence()],
  subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
  dueAt: daysFromNow(-20),
  createdAt: daysFromNow(-24),
  state: 'done',
  decidedAt: daysFromNow(-21),
};

const hearingPrelimA40Card: ActionCard<HearingPrepPayload> = {
  id: 'card-lit-hearing-prelim-a40',
  workspaceId: 'litigation',
  type: 'hearing_prep',
  priority: 'P3',
  title: 'Подготовиться к предварительному заседанию по делу А40-118742',
  summary: 'Предварительное заседание завершено, дело назначено к рассмотрению по существу.',
  payload: {
    caseNumber: '№А40-118742/2026',
    hearingAt: daysFromNow(-15, '10:30'),
    summary: 'Позиция для предварительного заседания подготовлена по материалам искового заявления, замечаний не поступило.',
  },
  sources: [srcA40RulingDate()],
  subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
  dueAt: daysFromNow(-15, '10:30'),
  createdAt: daysFromNow(-17),
  state: 'done',
  decidedAt: daysFromNow(-16),
};

const a41EvidenceCard: ActionCard<EvidenceRequestPayload> = {
  id: 'card-lit-a41-evidence',
  workspaceId: 'litigation',
  type: 'evidence_request',
  priority: 'P2',
  title: 'Собрать доказательства правомерности отказа по делу А41-9930',
  summary: 'Подтверждено — материалы, обосновывающие правомерность отказа, готовятся к подаче.',
  payload: {
    caseId: DOC.CASE_A41_CLAIM,
    caseNumber: '№А41-9930/2026',
    items: [{ what: 'Переписка с истцом, предшествующая отказу от исполнения', from: 'Внутренний архив' }],
    motionText: 'Прошу приобщить к материалам дела переписку, предшествующую одностороннему отказу от исполнения договора.',
    fileBy: daysFromNow(9),
  },
  sources: [srcA41Subject()],
  subjectRef: { kind: 'case', id: DOC.CASE_A41_CLAIM, label: 'Дело №А41-9930/2026' },
  dueAt: daysFromNow(9),
  createdAt: daysFromNow(-4),
  state: 'accepted',
  decidedAt: daysFromNow(-3),
};

const filingRejectedCard: ActionCard<FilingDeadlinePayload> = {
  id: 'card-lit-filing-rejected',
  workspaceId: 'litigation',
  type: 'filing_deadline',
  priority: 'P3',
  title: 'Подать ходатайство об отложении заседания',
  summary: 'Проект ходатайства об отложении отклонён — решено готовиться к заседанию в назначенную дату.',
  payload: {
    caseNumber: '№А40-118742/2026',
    summary: 'Ходатайство об отложении судебного заседания в связи с необходимостью дополнительного времени на подготовку позиции.',
  },
  sources: [srcA40RulingDate()],
  subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
  dueAt: daysFromNow(-8),
  createdAt: daysFromNow(-10),
  state: 'rejected',
  decidedAt: daysFromNow(-9),
};

export const litigationCards: ActionCard[] = [
  buildHearingPrepCard(THREAD.LIT_A40_POSITION, daysFromNow(12, '11:00')),
  buildFilingDeadlineCard(THREAD.LIT_A40_POSITION),
  evidenceA40Card,
  hearingA41Card,
  evidenceInitialCard,
  hearingPrelimA40Card,
  a41EvidenceCard,
  filingRejectedCard,
];
