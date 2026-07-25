/**
 * Сид тредов пространства «Дела» (этап 8, docs/SCENARIOS.md §2).
 * Идентификаторы — строго `THREAD` из `core/agent/scenarios/refs.ts`.
 * Сообщения — в соседнем `messages.ts`.
 */
import type { Thread } from '@/types/domain';
import { DOC, THREAD } from '@/core/agent/scenarios/refs';
import { daysFromNow } from '@/core/agent/scenarios/dates';

export const litigationThreads: Thread[] = [
  {
    id: THREAD.LIT_A40_POSITION,
    workspaceId: 'litigation',
    title: 'Позиция по делу А40-118742',
    status: 'active',
    subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
    createdAt: daysFromNow(-2, '10:02'),
    updatedAt: daysFromNow(-2, '10:04'),
    unread: false,
  },
  {
    id: THREAD.LIT_A40_EVIDENCE,
    workspaceId: 'litigation',
    title: 'Доказательства к заседанию 05.08',
    status: 'active',
    subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
    createdAt: daysFromNow(-1, '16:20'),
    updatedAt: daysFromNow(-1, '16:23'),
    unread: false,
  },
  {
    id: THREAD.LIT_A41,
    workspaceId: 'litigation',
    title: 'Дело А41-9930: односторонний отказ',
    status: 'active',
    subjectRef: { kind: 'case', id: DOC.CASE_A41_CLAIM, label: 'Дело №А41-9930/2026' },
    createdAt: daysFromNow(-6, '09:40'),
    updatedAt: daysFromNow(-6, '09:44'),
    unread: false,
  },
];
