/**
 * История сообщений тредов пространства «Обязательства» (этап 8). Диалоги
 * коротки, но содержательны: вопрос юриста → ответ агента с кликабельными
 * источниками → предложенная карточка (`card_ref`). `thread-obl-penalty`
 * намеренно оставлен в `awaiting_user` — агент задал уточняющий вопрос
 * (`clarify`-блок) и ждёт ответа, демонстрируя это состояние в UI.
 */
import type { Message } from '@/types/domain';
import { CARD, THREAD, srcLeaseNotice, srcLeaseRenewal, srcLetterVektorClaim, srcServices27Renewal, srcSupply118Delivery, srcSupply118Penalty, srcSupply203Renewal } from '@/core/agent/scenarios/refs';
import { daysFromNow, formatDdMmYyyy, formatRuDay } from '@/core/agent/scenarios/dates';

export const obligationsMessages: Message[] = [
  // ── thread-obl-renewals ──────────────────────────────────────────────
  {
    id: 'msg-obl-renewals-1',
    threadId: THREAD.OBL_RENEWALS,
    role: 'user',
    blocks: [{ type: 'text', text: 'Проверь, по каким договорам скоро автопродление.', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(0, '08:31'),
  },
  {
    id: 'msg-obl-renewals-2',
    threadId: THREAD.OBL_RENEWALS,
    role: 'agent',
    blocks: [
      { type: 'text', text: 'Проверил портфель: под условие об автопродлении подходят три договора.', citations: [] },
      {
        type: 'table',
        head: ['Договор', 'Контрагент', 'Пролонгация', 'Уведомить до'],
        rows: [
          ['№44-АР', 'ООО «Прайм Ритейл»', formatDdMmYyyy(daysFromNow(50)), formatDdMmYyyy(daysFromNow(1))],
          ['№27-У', 'ИП Соколов А. В.', formatDdMmYyyy(daysFromNow(53)), formatDdMmYyyy(daysFromNow(23))],
          ['№203/П', 'АО «Северный логистический альянс»', formatDdMmYyyy(daysFromNow(58)), formatDdMmYyyy(daysFromNow(28))],
        ],
        citations: [srcLeaseRenewal(), srcServices27Renewal(), srcSupply203Renewal()],
      },
      {
        type: 'text',
        text: 'Самый срочный — №44-АР: уведомить нужно уже завтра. По двум другим время есть, но лучше решить заранее, а не в последний момент.',
        citations: [srcLeaseNotice()],
      },
      { type: 'card_ref', cardId: CARD.RENEWAL_44 },
      { type: 'card_ref', cardId: CARD.RENEWAL_27 },
      { type: 'card_ref', cardId: CARD.RENEWAL_203 },
    ],
    status: 'complete',
    createdAt: daysFromNow(0, '08:33'),
  },

  // ── thread-obl-vektor ────────────────────────────────────────────────
  {
    id: 'msg-obl-vektor-1',
    threadId: THREAD.OBL_VEKTOR,
    role: 'user',
    blocks: [{ type: 'text', text: 'Что делать с письмом «Вектора» о повышении цены?', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(-1, '11:05'),
  },
  {
    id: 'msg-obl-vektor-2',
    threadId: THREAD.OBL_VEKTOR,
    role: 'agent',
    blocks: [
      {
        type: 'text',
        text: `«Вектор» просит повысить цену на 12% с ${formatRuDay(daysFromNow(39))}, ссылаясь на рост логистических издержек.`,
        citations: [srcLetterVektorClaim()],
      },
      {
        type: 'text',
        text: 'Проверил договор поставки №118/П: цена, зафиксированная в спецификации, твёрдая и одностороннему изменению Поставщиком не подлежит — основания отказать есть.',
        citations: [srcSupply118Delivery()],
      },
      { type: 'card_ref', cardId: CARD.VEKTOR_PRICE },
    ],
    status: 'complete',
    createdAt: daysFromNow(-1, '11:08'),
  },

  // ── thread-obl-penalty (awaiting_user) ─────────────────────────────
  {
    id: 'msg-obl-penalty-1',
    threadId: THREAD.OBL_PENALTY,
    role: 'user',
    blocks: [{ type: 'text', text: 'Посчитай неустойку по просрочке поставки по 118/П.', citations: [] }],
    status: 'complete',
    createdAt: daysFromNow(0, '09:14'),
  },
  {
    id: 'msg-obl-penalty-2',
    threadId: THREAD.OBL_PENALTY,
    role: 'agent',
    blocks: [
      {
        type: 'text',
        text: 'По п. 6.1 договора неустойка составляет 0,1% от стоимости не поставленного в срок товара за каждый день просрочки.',
        citations: [srcSupply118Penalty()],
      },
      {
        type: 'clarify',
        question: 'За какой период считать просрочку — с даты по спецификации №14 или с даты фактической приёмки товара?',
        options: ['С даты по спецификации №14', 'С даты фактической приёмки товара'],
      },
    ],
    status: 'complete',
    createdAt: daysFromNow(0, '09:16'),
  },
];
