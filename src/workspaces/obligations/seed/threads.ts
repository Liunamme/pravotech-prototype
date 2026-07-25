/**
 * Сид тредов пространства «Обязательства» (этап 8, docs/SCENARIOS.md §2).
 * Идентификаторы — строго `THREAD` из `core/agent/scenarios/refs.ts`.
 * Сообщения (`Message[]`) — в соседнем `messages.ts`, чтобы юрист, открыв
 * пространство, видел уже состоявшийся разговор, а не «Пока ни одного
 * разговора».
 */
import type { Thread } from '@/types/domain';
import { DOC, THREAD } from '@/core/agent/scenarios/refs';
import { daysFromNow } from '@/core/agent/scenarios/dates';

export const obligationsThreads: Thread[] = [
  {
    id: THREAD.OBL_RENEWALS,
    workspaceId: 'obligations',
    title: 'Автопролонгации в портфеле',
    status: 'active',
    createdAt: daysFromNow(0, '08:31'),
    updatedAt: daysFromNow(0, '08:33'),
    unread: false,
  },
  {
    id: THREAD.OBL_VEKTOR,
    workspaceId: 'obligations',
    title: 'Письмо «Вектора» о повышении цены',
    status: 'active',
    subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
    createdAt: daysFromNow(-1, '11:05'),
    updatedAt: daysFromNow(-1, '11:08'),
    unread: false,
  },
  {
    id: THREAD.OBL_PENALTY,
    workspaceId: 'obligations',
    title: 'Неустойка по договору №118/П',
    status: 'awaiting_user',
    subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
    createdAt: daysFromNow(0, '09:14'),
    updatedAt: daysFromNow(0, '09:16'),
    unread: true,
  },
];
