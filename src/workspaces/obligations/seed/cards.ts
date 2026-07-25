/**
 * Сид карточек пространства «Обязательства» (этап 8, docs/SCENARIOS.md §4).
 *
 * Канонические карточки (`RENEWAL_44`/`RENEWAL_27`/`RENEWAL_203`/
 * `VEKTOR_PRICE`) построены теми же фабриками (`core/agent/scenarios/
 * cards.ts`), что использует мок-агент в `morningDigest`/`autoRenewalScan`/
 * `priceIncreaseRefusal` — тот же `id`, тот же payload с первого кадра
 * (docs/DOMAIN.md §4: «одна карточка — одна запись»). Когда юрист
 * запускает один из этих сценариев в демо, агент «переподтверждает» уже
 * видимую карточку, а не создаёт дубль — это штатное поведение, не баг.
 *
 * Остальные карточки (платежи, уже решённые исторические записи) не
 * строятся ни одним сценарием — их `id` подобраны так, чтобы не
 * пересекаться с `CARD` из `refs.ts` (единственным источником id, которые
 * может произвести мок-агент).
 */
import type { ActionCard } from '@/types/domain';
import {
  buildRenewal203Card,
  buildRenewal27Card,
  buildRenewal44Card,
  buildVektorPriceCard,
  type ObligationBreachPayload,
  type RenewalNoticePayload,
} from '@/core/agent/scenarios/cards';
import {
  CARD,
  COUNTERPARTY,
  DOC,
  THREAD,
  srcLeaseIndexation,
  srcLeaseRenewal,
  srcSupply118Payment,
  srcSupply118Penalty,
} from '@/core/agent/scenarios/refs';
import { daysFromNow, now } from '@/core/agent/scenarios/dates';
import type { PaymentDuePayload } from '../cards/paymentDue';

/* ─────────────────────────────────  Ожидают решения  ────────────────────────────────── */

const payment4471Card: ActionCard<PaymentDuePayload> = {
  id: CARD.PAYMENT_4471,
  workspaceId: 'obligations',
  type: 'payment_due',
  priority: 'P2',
  title: 'Согласовать оплату по счёту №4471',
  summary: 'Счёт выставлен в соответствии со спецификацией к договору поставки — цена зафиксирована и подлежит оплате.',
  payload: {
    contractId: DOC.SUPPLY_118,
    invoiceNumber: '№4471',
    amount: 1_284_000,
    currency: 'RUB',
    dueDate: daysFromNow(10),
    payee: COUNTERPARTY.VEKTOR,
  },
  sources: [srcSupply118Payment()],
  subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
  dueAt: daysFromNow(10),
  createdAt: now(),
  state: 'pending',
};

const payment8825Card: ActionCard<PaymentDuePayload> = {
  id: 'card-payment-8825',
  workspaceId: 'obligations',
  type: 'payment_due',
  priority: 'P3',
  title: 'Согласовать оплату по счёту №8825',
  summary: 'Очередная партия по спецификации — срок ещё не горит, но стоит подтвердить заранее.',
  payload: {
    contractId: DOC.SUPPLY_118,
    invoiceNumber: '№8825',
    amount: 392_500,
    currency: 'RUB',
    dueDate: daysFromNow(25),
    payee: COUNTERPARTY.VEKTOR,
  },
  sources: [srcSupply118Payment()],
  subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
  dueAt: daysFromNow(25),
  createdAt: now(),
  state: 'pending',
};

/* ─────────────────────────────────  Уже решённые (история)  ─────────────────────────── */

const payment2201Card: ActionCard<PaymentDuePayload> = {
  id: 'card-obl-payment-2201',
  workspaceId: 'obligations',
  type: 'payment_due',
  priority: 'P2',
  title: 'Оплата по счёту №2201',
  summary: 'Оплата партии по спецификации №11 — подтверждена и исполнена в срок.',
  payload: {
    contractId: DOC.SUPPLY_118,
    invoiceNumber: '№2201',
    amount: 861_400,
    currency: 'RUB',
    dueDate: daysFromNow(-16),
    payee: COUNTERPARTY.VEKTOR,
  },
  sources: [srcSupply118Payment()],
  subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
  dueAt: daysFromNow(-16),
  createdAt: daysFromNow(-20),
  state: 'done',
  decidedAt: daysFromNow(-18),
};

const indexationClaimRejectedCard: ActionCard<ObligationBreachPayload> = {
  id: 'card-obl-indexation-rejected',
  workspaceId: 'obligations',
  type: 'obligation_breach',
  priority: 'P2',
  title: 'Требование ООО «Прайм Ритейл» о доиндексации арендной платы',
  summary: 'Арендодатель требовал применить индексацию сверх установленного договором предела — отклонено.',
  payload: {
    counterparty: COUNTERPARTY.PRIME_RETAIL,
    claim: 'Арендодатель настаивал на индексации арендной платы на 11% вместо предусмотренных договором 8%.',
    draftResponse:
      'Уважаемые коллеги, размер индексации арендной платы по Договору №44-АР ограничен п. 4.5 Договора' +
      ' восемью процентами. Готовы произвести перерасчёт исходя из установленного договором предела.',
  },
  sources: [srcLeaseIndexation()],
  subjectRef: { kind: 'contract', id: DOC.LEASE_44, label: 'Договор №44-АР' },
  dueAt: daysFromNow(-12),
  createdAt: daysFromNow(-14),
  state: 'rejected',
  decidedAt: daysFromNow(-12),
};

const renewal44LegacyCard: ActionCard<RenewalNoticePayload> = {
  id: 'card-obl-renewal-44-legacy',
  workspaceId: 'obligations',
  type: 'renewal_notice',
  priority: 'P3',
  title: 'Решение по автопролонгации №44-АР (прошлый цикл)',
  summary: 'Годом ранее было решено не направлять отказ — договор продлился на текущий 11-месячный срок.',
  payload: {
    contractTitle: 'Договор аренды нежилого помещения №44-АР от 12.03.2024',
    contractDocId: DOC.LEASE_44,
    counterparty: COUNTERPARTY.PRIME_RETAIL,
    renewalDate: daysFromNow(-335),
    noticeDeadline: daysFromNow(-384),
    draftNotice:
      'Уведомление не направлялось — было принято решение продолжить аренду на новый срок на прежних условиях' +
      ' в соответствии с п. 7.2 Договора.',
  },
  sources: [srcLeaseRenewal()],
  subjectRef: { kind: 'contract', id: DOC.LEASE_44, label: 'Договор №44-АР' },
  dueAt: daysFromNow(-384),
  createdAt: daysFromNow(-386),
  state: 'accepted',
  decidedAt: daysFromNow(-384),
};

const paymentEarlyCard: ActionCard<PaymentDuePayload> = {
  id: 'card-obl-payment-early',
  workspaceId: 'obligations',
  type: 'payment_due',
  priority: 'P3',
  title: 'Оплата по счёту №9012',
  summary: 'Подтверждена заранее — платёж поставлен в очередь на согласование с финдиректором.',
  payload: {
    contractId: DOC.SUPPLY_118,
    invoiceNumber: '№9012',
    amount: 214_900,
    currency: 'RUB',
    dueDate: daysFromNow(15),
    payee: COUNTERPARTY.VEKTOR,
  },
  sources: [srcSupply118Penalty()],
  subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
  dueAt: daysFromNow(15),
  createdAt: daysFromNow(-2),
  state: 'accepted',
  decidedAt: daysFromNow(-1),
};

export const obligationsCards: ActionCard[] = [
  buildRenewal44Card(THREAD.OBL_RENEWALS),
  buildRenewal27Card(THREAD.OBL_RENEWALS),
  buildRenewal203Card(THREAD.OBL_RENEWALS),
  buildVektorPriceCard(THREAD.OBL_VEKTOR),
  payment4471Card,
  payment8825Card,
  payment2201Card,
  indexationClaimRejectedCard,
  renewal44LegacyCard,
  paymentEarlyCard,
];
