/**
 * Фабрики карточек действий, которые эмитят сценарии (docs/SCENARIOS.md, §4).
 *
 * Вынесены отдельно от самих сценариев, потому что одна и та же карточка
 * (тот же `id`) может всплывать из разных сценариев — например, отказ от
 * пролонгации №44-АР одновременно упоминается в `morningDigest` и строится
 * заново в `autoRenewalScan`. Это остаётся одной записью с одним `id`
 * (docs/DOMAIN.md, инвариант «одна карточка — один рендерер»).
 *
 * Формы `payload` здесь — временное, разумное приближение: этап 4 не
 * владеет реестром типов карточек пространств (`CardTypeDef<P>`,
 * `workspaces/*\/cards`, этапы 5–6), поэтому финальный контракт `P` может
 * быть уточнён позже. Здесь важно, чтобы объект был самодостаточным и
 * пригодным для показа уже сейчас.
 */

import type { ActionCard, Id, IsoDateTime, Priority, SourceRef, SubjectRef } from '@/types/domain';
import { daysFromNow, now } from './dates';
import {
  CARD,
  COUNTERPARTY,
  DOC,
  WORKSPACE,
  srcA40ExpertConclusion,
  srcA40ResponseArg1,
  srcLeaseNotice,
  srcLeaseRenewal,
  srcLetterVektorClaim,
  srcPractice14,
  srcServices27Renewal,
  srcSupply118Delivery,
  srcSupply203Renewal,
} from './refs';

export type RenewalNoticePayload = {
  contractTitle: string;
  contractDocId: Id;
  counterparty: string;
  renewalDate: IsoDateTime;
  noticeDeadline: IsoDateTime;
  draftNotice: string;
};

export type ObligationBreachPayload = {
  counterparty: string;
  claim: string;
  draftResponse: string;
};

export type HearingPrepPayload = {
  caseNumber: string;
  hearingAt: IsoDateTime;
  summary: string;
};

export type FilingDeadlinePayload = {
  caseNumber: string;
  summary: string;
};

function baseCard<P>(args: {
  id: Id;
  workspaceId: Id;
  type: string;
  priority: Priority;
  title: string;
  summary: string;
  payload: P;
  sources: SourceRef[];
  subjectRef?: SubjectRef;
  originThreadId?: Id;
  dueAt?: IsoDateTime;
}): ActionCard<P> {
  return {
    id: args.id,
    workspaceId: args.workspaceId,
    type: args.type,
    priority: args.priority,
    title: args.title,
    summary: args.summary,
    payload: args.payload,
    sources: args.sources,
    subjectRef: args.subjectRef,
    originThreadId: args.originThreadId,
    dueAt: args.dueAt,
    createdAt: now(),
    state: 'pending',
  };
}

export function buildRenewal44Card(originThreadId: Id): ActionCard<RenewalNoticePayload> {
  const renewalDate = daysFromNow(50);
  const noticeDeadline = daysFromNow(1);
  return baseCard({
    id: CARD.RENEWAL_44,
    workspaceId: WORKSPACE.OBLIGATIONS,
    type: 'renewal_notice',
    priority: 'P0',
    title: 'Направить отказ от пролонгации по №44-АР',
    summary: 'Срок направления отказа от автопролонгации истекает завтра — договор иначе продлится на 11 месяцев.',
    payload: {
      contractTitle: 'Договор аренды нежилого помещения №44-АР от 12.03.2024',
      contractDocId: DOC.LEASE_44,
      counterparty: COUNTERPARTY.PRIME_RETAIL,
      renewalDate,
      noticeDeadline,
      draftNotice:
        'Уведомляем о намерении не продлевать действие Договора аренды нежилого помещения №44-АР от 12.03.2024' +
        ' на новый срок. Договор прекращает действие по истечении установленного срока в соответствии с п. 7.2, 7.3 Договора.',
    },
    sources: [srcLeaseNotice(), srcLeaseRenewal()],
    subjectRef: { kind: 'contract', id: DOC.LEASE_44, label: 'Договор №44-АР' },
    originThreadId,
    dueAt: noticeDeadline,
  });
}

export function buildRenewal27Card(originThreadId: Id): ActionCard<RenewalNoticePayload> {
  const renewalDate = daysFromNow(53);
  const noticeDeadline = daysFromNow(23);
  return baseCard({
    id: CARD.RENEWAL_27,
    workspaceId: WORKSPACE.OBLIGATIONS,
    type: 'renewal_notice',
    priority: 'P2',
    title: 'Решить по автопролонгации №27-У',
    summary: 'Договор продлится автоматически, если не уведомить контрагента заранее.',
    payload: {
      contractTitle: 'Договор оказания услуг №27-У от 15.01.2025',
      contractDocId: DOC.SERVICES_27,
      counterparty: COUNTERPARTY.SOKOLOV,
      renewalDate,
      noticeDeadline,
      draftNotice:
        'Уведомляем о намерении не продлевать действие Договора оказания услуг №27-У от 15.01.2025' +
        ' на новый срок в соответствии с п. 9.1 Договора.',
    },
    sources: [srcServices27Renewal()],
    subjectRef: { kind: 'contract', id: DOC.SERVICES_27, label: 'Договор №27-У' },
    originThreadId,
    dueAt: noticeDeadline,
  });
}

export function buildRenewal203Card(originThreadId: Id): ActionCard<RenewalNoticePayload> {
  const renewalDate = daysFromNow(58);
  const noticeDeadline = daysFromNow(28);
  return baseCard({
    id: CARD.RENEWAL_203,
    workspaceId: WORKSPACE.OBLIGATIONS,
    type: 'renewal_notice',
    priority: 'P2',
    title: 'Решить по автопролонгации №203/П',
    summary: 'Договор продлится автоматически, если не уведомить контрагента заранее.',
    payload: {
      contractTitle: 'Договор поставки №203/П от 20.02.2026',
      contractDocId: DOC.SUPPLY_203,
      counterparty: COUNTERPARTY.SLA,
      renewalDate,
      noticeDeadline,
      draftNotice:
        'Уведомляем о намерении не продлевать действие Договора поставки №203/П от 20.02.2026' +
        ' на новый срок в соответствии с п. 8.4 Договора.',
    },
    sources: [srcSupply203Renewal()],
    subjectRef: { kind: 'contract', id: DOC.SUPPLY_203, label: 'Договор №203/П' },
    originThreadId,
    dueAt: noticeDeadline,
  });
}

export function buildVektorPriceCard(originThreadId: Id): ActionCard<ObligationBreachPayload> {
  return baseCard({
    id: CARD.VEKTOR_PRICE,
    workspaceId: WORKSPACE.OBLIGATIONS,
    type: 'obligation_breach',
    priority: 'P1',
    title: 'Ответить на требование «Вектора» о повышении цены',
    summary: 'Одностороннее изменение цены договором не предусмотрено — есть основания отказать.',
    payload: {
      counterparty: COUNTERPARTY.VEKTOR,
      claim: 'Повышение цены на 12% в одностороннем порядке со ссылкой на рост логистических издержек.',
      draftResponse:
        'Уважаемые коллеги, направленное уведомление о повышении цены не может быть принято в качестве' +
        ' основания для изменения цены по Договору поставки №118/П, поскольку договор не предусматривает' +
        ' право Поставщика на одностороннее изменение цены. Готовы обсудить корректировку условий по' +
        ' соглашению Сторон.',
    },
    sources: [srcLetterVektorClaim(), srcSupply118Delivery()],
    subjectRef: { kind: 'contract', id: DOC.SUPPLY_118, label: 'Договор поставки №118/П' },
    originThreadId,
    dueAt: daysFromNow(7),
  });
}

export function buildHearingPrepCard(originThreadId: Id, hearingAt: IsoDateTime): ActionCard<HearingPrepPayload> {
  return baseCard({
    id: CARD.HEARING_A40,
    workspaceId: WORKSPACE.LITIGATION,
    type: 'hearing_prep',
    priority: 'P0',
    title: 'Утвердить позицию к заседанию 05.08',
    summary: 'Позиция на оба довода отзыва готова — требует вашей проверки перед заседанием.',
    payload: {
      caseNumber: '№А40-118742/2026',
      hearingAt,
      summary:
        'Довод о пропуске срока исковой давности отклоняется со ссылкой на п. 14 Обзора практики ВС РФ №2 (2024).' +
        ' Довод о качестве товара опровергается заключением эксперта.',
    },
    sources: [srcA40ResponseArg1(), srcPractice14(), srcA40ExpertConclusion()],
    subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
    originThreadId,
    dueAt: hearingAt,
  });
}

export function buildFilingDeadlineCard(originThreadId: Id): ActionCard<FilingDeadlinePayload> {
  const dueAt = daysFromNow(5);
  return baseCard({
    id: CARD.FILING_A40,
    workspaceId: WORKSPACE.LITIGATION,
    type: 'filing_deadline',
    priority: 'P1',
    title: 'Подать возражения на отзыв до 29.07',
    summary: 'Срок подачи возражений на отзыв ответчика по делу №А40-118742/2026.',
    payload: {
      caseNumber: '№А40-118742/2026',
      summary: 'Возражения на отзыв ответчика необходимо подать в суд не позднее указанного срока.',
    },
    sources: [srcA40ResponseArg1()],
    subjectRef: { kind: 'case', id: DOC.CASE_A40_CLAIM, label: 'Дело №А40-118742/2026' },
    originThreadId,
    dueAt,
  });
}
