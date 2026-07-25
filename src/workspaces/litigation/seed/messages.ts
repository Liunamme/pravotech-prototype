/**
 * История сообщений тредов пространства «Дела» (этап 8). Диалоги короткие,
 * но содержательные: вопрос юриста → ответ агента с кликабельными
 * источниками → предложенная карточка (`card_ref`).
 */
import type { Message } from '@/types/domain';
import {
  CARD,
  THREAD,
  srcA40ExpertConclusion,
  srcA40ResponseArg1,
  srcA40RulingEvidence,
  srcA41Subject,
  srcPractice14,
} from '@/core/agent/scenarios/refs';
import { daysFromNow } from '@/core/agent/scenarios/dates';

export const litigationMessages: Message[] = [
  // ── thread-lit-a40-position ─────────────────────────────────────────
  {
    id: 'msg-lit-position-1',
    threadId: THREAD.LIT_A40_POSITION,
    role: 'user',
    blocks: [{ type: 'text', text: 'Подготовь позицию к заседанию по делу А40-118742.', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(-2, '10:02'),
  },
  {
    id: 'msg-lit-position-2',
    threadId: THREAD.LIT_A40_POSITION,
    role: 'agent',
    blocks: [
      {
        type: 'text',
        text: 'Ответчик ссылается на пропуск срока исковой давности — довод не подтверждается материалами дела.',
        citations: [srcA40ResponseArg1()],
      },
      {
        type: 'text',
        text: 'По п. 14 Обзора практики ВС РФ №2 (2024) срок исковой давности начинает течь со дня, следующего за днём, когда обязательство должно было быть исполнено, а не с момента иных действий сторон.',
        citations: [srcPractice14()],
      },
      {
        type: 'text',
        text: 'Второй довод — о несоответствии качества товара — опровергается заключением эксперта: выявленные отклонения признаны несущественными и не препятствующими использованию товара по назначению.',
        citations: [srcA40ExpertConclusion()],
      },
      { type: 'card_ref', cardId: CARD.HEARING_A40 },
    ],
    status: 'complete',
    createdAt: daysFromNow(-2, '10:04'),
  },

  // ── thread-lit-a40-evidence ──────────────────────────────────────────
  {
    id: 'msg-lit-evidence-1',
    threadId: THREAD.LIT_A40_EVIDENCE,
    role: 'user',
    blocks: [{ type: 'text', text: 'Что делать с определением суда об истребовании доказательств?', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(-1, '16:20'),
  },
  {
    id: 'msg-lit-evidence-2',
    threadId: THREAD.LIT_A40_EVIDENCE,
    role: 'agent',
    blocks: [
      {
        type: 'text',
        text: 'Суд предложил вам представить документы, подтверждающие факт и объём поставки за спорный период. Подготовил ходатайство об истребовании этих же документов у истца — на случай, если у вас их нет в полном объёме.',
        citations: [srcA40RulingEvidence()],
      },
      { type: 'card_ref', cardId: CARD.EVIDENCE_A40 },
    ],
    status: 'complete',
    createdAt: daysFromNow(-1, '16:23'),
  },

  // ── thread-lit-a41 ───────────────────────────────────────────────────
  {
    id: 'msg-lit-a41-1',
    threadId: THREAD.LIT_A41,
    role: 'user',
    blocks: [{ type: 'text', text: 'Расскажи о деле А41-9930.', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(-6, '09:40'),
  },
  {
    id: 'msg-lit-a41-2',
    threadId: THREAD.LIT_A41,
    role: 'agent',
    blocks: [
      {
        type: 'text',
        text: 'Истец, ООО «Прайм Ритейл», просит признать недействительным ваш односторонний отказ от исполнения договора и обязать возобновить исполнение в полном объёме.',
        citations: [srcA41Subject()],
      },
      {
        type: 'text',
        text: 'Предварительное заседание уже назначено. Собираю материалы, подтверждающие правомерность отказа.',
        citations: [],
      },
      { type: 'card_ref', cardId: 'card-hearing-a41' },
    ],
    status: 'complete',
    createdAt: daysFromNow(-6, '09:44'),
  },
];
