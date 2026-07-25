/**
 * Канон демо-сущностей (docs/SCENARIOS.md, §2).
 *
 * Контракт между этапом 4 (этот файл) и этапом 8 (демо-данные/сиды):
 * идентификаторы ниже — единственный источник правды. Этап 8 обязан
 * заводить документы под ровно эти `id`/`anchorId`, иначе ссылки на
 * источники в чате разъедутся с документами в инспекторе.
 *
 * Цитаты (`quote`) в фабриках `SourceRef` — правдоподобный юридический
 * текст. Он попадёт и в тултипы чипов источников, и в тела документов
 * этапа 8 — старайтесь не менять формулировки без синхронизации с ним.
 */

import type { Id, SourceRef } from '@/types/domain';

/** Идентификаторы рабочих пространств (совпадают с `Rail` этапа 1/3). */
export const WORKSPACE = {
  OBLIGATIONS: 'obligations',
  LITIGATION: 'litigation',
} as const;

/** Контрагенты, упоминаемые в сценариях. */
export const COUNTERPARTY = {
  VEKTOR: 'ООО «Вектор»',
  SLA: 'АО «Северный логистический альянс»',
  PRIME_RETAIL: 'ООО «Прайм Ритейл»',
  SOKOLOV: 'ИП Соколов А. В.',
} as const;

/** Номера дел. */
export const CASE = {
  A40: '№А40-118742/2026',
  A41: '№А41-9930/2026',
} as const;

export const DOC = {
  LEASE_44: 'doc-lease-44',
  SUPPLY_118: 'doc-supply-118',
  SERVICES_27: 'doc-services-27',
  NDA_09: 'doc-nda-09',
  LETTER_VEKTOR: 'doc-letter-ooo-vektor',
  SUPPLY_203: 'doc-supply-203',
  CASE_A40_CLAIM: 'doc-case-a40-claim',
  CASE_A40_RULING: 'doc-case-a40-ruling',
  CASE_A40_RESPONSE: 'doc-case-a40-response',
  CASE_A41_CLAIM: 'doc-case-a41-claim',
  PRACTICE_VS_2024: 'doc-practice-vs-2024',
  CASE_A40_EXPERT: 'doc-case-a40-expert',
} as const satisfies Record<string, Id>;

export const ANCHOR = {
  LEASE_44_RENEWAL: 'a-lease-44-renewal',
  LEASE_44_NOTICE: 'a-lease-44-notice',
  LEASE_44_INDEXATION: 'a-lease-44-indexation',
  SUPPLY_118_PENALTY: 'a-supply-118-penalty',
  SUPPLY_118_DELIVERY: 'a-supply-118-delivery',
  SUPPLY_118_PAYMENT: 'a-supply-118-payment',
  SERVICES_27_RENEWAL: 'a-services-27-renewal',
  SERVICES_27_PRICE: 'a-services-27-price',
  NDA_09_TERM: 'a-nda-09-term',
  LETTER_VEKTOR_CLAIM: 'a-letter-vektor-claim',
  SUPPLY_203_RENEWAL: 'a-supply-203-renewal',
  SUPPLY_203_QUALITY: 'a-supply-203-quality',
  A40_SUBJECT: 'a-a40-subject',
  A40_AMOUNT: 'a-a40-amount',
  A40_RULING_DATE: 'a-a40-ruling-date',
  A40_RULING_EVIDENCE: 'a-a40-ruling-evidence',
  A40_RESPONSE_ARG1: 'a-a40-response-arg1',
  A40_RESPONSE_ARG2: 'a-a40-response-arg2',
  A41_SUBJECT: 'a-a41-subject',
  PRACTICE_14: 'a-practice-14',
  A40_EXPERT_CONCLUSION: 'a-a40-expert-conclusion',
} as const satisfies Record<string, Id>;

export const THREAD = {
  TODAY: 'thread-today',
  OBL_RENEWALS: 'thread-obl-renewals',
  OBL_VEKTOR: 'thread-obl-vektor',
  OBL_PENALTY: 'thread-obl-penalty',
  LIT_A40_POSITION: 'thread-lit-a40-position',
  LIT_A40_EVIDENCE: 'thread-lit-a40-evidence',
  LIT_A41: 'thread-lit-a41',
} as const satisfies Record<string, Id>;

/**
 * Идентификаторы карточек, которые могут повторно всплывать в разных
 * сценариях (например, отказ от пролонгации №44-АР упоминается и в
 * `morningDigest`, и в `autoRenewalScan`) — это ОДНА запись с одним `id`
 * (docs/DOMAIN.md, инвариант «одна карточка — один рендерер»), поэтому id
 * зафиксирован здесь, а не сгенерирован на лету в каждом сценарии.
 */
export const CARD = {
  RENEWAL_44: 'card-renewal-44',
  RENEWAL_27: 'card-renewal-27',
  RENEWAL_203: 'card-renewal-203',
  VEKTOR_PRICE: 'card-vektor-price',
  PAYMENT_4471: 'card-payment-4471',
  HEARING_A40: 'card-hearing-a40',
  EVIDENCE_A40: 'card-evidence-a40',
  FILING_A40: 'card-filing-a40',
} as const satisfies Record<string, Id>;

/** Фоновые задачи (`BackgroundTask.id`). */
export const TASK = {
  CASE_POSITION_A40: 'task-case-position-a40',
} as const satisfies Record<string, Id>;

function ref(id: string, docId: Id, anchorId: Id, label: string, quote: string): () => SourceRef {
  return () => ({ id, docId, anchorId, label, quote });
}

/* ───────────────────────────  Обязательства по договорам  ───────────────────────────── */

export const srcLeaseRenewal = ref(
  'src-a-lease-44-renewal',
  DOC.LEASE_44,
  ANCHOR.LEASE_44_RENEWAL,
  'Договор №44-АР, п. 7.2',
  'Если ни одна из Сторон не позднее чем за 49 (сорок девять) календарных дней до истечения срока действия настоящего Договора не заявит о своём намерении прекратить его действие, Договор считается продлённым на новый срок 11 (одиннадцать) месяцев на тех же условиях.',
);

export const srcLeaseNotice = ref(
  'src-a-lease-44-notice',
  DOC.LEASE_44,
  ANCHOR.LEASE_44_NOTICE,
  'Договор №44-АР, п. 7.3',
  'Уведомление о намерении прекратить действие Договора направляется другой Стороне в письменной форме не позднее срока, указанного в п. 7.2 настоящего Договора.',
);

export const srcLeaseIndexation = ref(
  'src-a-lease-44-indexation',
  DOC.LEASE_44,
  ANCHOR.LEASE_44_INDEXATION,
  'Договор №44-АР, п. 4.5',
  'Арендная плата подлежит ежегодной индексации на величину, равную индексу потребительских цен за предыдущий календарный год, но не более чем на 8 (восемь) процентов.',
);

export const srcSupply118Penalty = ref(
  'src-a-supply-118-penalty',
  DOC.SUPPLY_118,
  ANCHOR.SUPPLY_118_PENALTY,
  'Договор поставки №118/П, п. 6.1',
  'За нарушение сроков поставки Товара Поставщик уплачивает Покупателю неустойку в размере 0,1 (ноль целых одна десятая) процента от стоимости не поставленного в срок Товара за каждый день просрочки.',
);

export const srcSupply118Delivery = ref(
  'src-a-supply-118-delivery',
  DOC.SUPPLY_118,
  ANCHOR.SUPPLY_118_DELIVERY,
  'Договор поставки №118/П, п. 3.4',
  'Поставка Товара осуществляется партиями согласно Спецификациям, являющимся неотъемлемой частью настоящего Договора. Цена Товара, зафиксированная в Спецификации, является твёрдой на весь срок её действия и изменению Поставщиком в одностороннем порядке не подлежит.',
);

export const srcSupply118Payment = ref(
  'src-a-supply-118-payment',
  DOC.SUPPLY_118,
  ANCHOR.SUPPLY_118_PAYMENT,
  'Договор поставки №118/П, п. 4.2',
  'Покупатель обязан оплатить поставленный Товар не позднее 15 (пятнадцати) банковских дней с даты подписания Сторонами товарной накладной на соответствующую партию.',
);

export const srcServices27Renewal = ref(
  'src-a-services-27-renewal',
  DOC.SERVICES_27,
  ANCHOR.SERVICES_27_RENEWAL,
  'Договор №27-У, п. 9.1',
  'Договор автоматически продлевается на каждый следующий календарный год, если ни одна из Сторон не уведомит другую Сторону о прекращении его действия не позднее чем за 30 (тридцать) календарных дней до окончания текущего срока.',
);

export const srcServices27Price = ref(
  'src-a-services-27-price',
  DOC.SERVICES_27,
  ANCHOR.SERVICES_27_PRICE,
  'Договор №27-У, п. 5.2',
  'Стоимость услуг по настоящему Договору устанавливается в Приложении №1 и может быть изменена только по соглашению Сторон, оформленному дополнительным соглашением.',
);

export const srcNda09Term = ref(
  'src-a-nda-09-term',
  DOC.NDA_09,
  ANCHOR.NDA_09_TERM,
  'Соглашение №09-К, п. 4.1',
  'Настоящее Соглашение действует в течение 3 (трёх) лет с даты его подписания, а в части обязательств о неразглашении конфиденциальной информации — в течение 5 (пяти) лет после прекращения его действия.',
);

export const srcLetterVektorClaim = ref(
  'src-a-letter-vektor-claim',
  DOC.LETTER_VEKTOR,
  ANCHOR.LETTER_VEKTOR_CLAIM,
  'Письмо ООО «Вектор», абз. 2',
  'Настоящим уведомляем, что в связи с ростом логистических издержек ООО «Вектор» вынуждено повысить цену на поставляемый Товар на 12 (двенадцать) процентов. Просим считать данное уведомление достаточным основанием для применения новой цены.',
);

export const srcSupply203Renewal = ref(
  'src-a-supply-203-renewal',
  DOC.SUPPLY_203,
  ANCHOR.SUPPLY_203_RENEWAL,
  'Договор поставки №203/П, п. 8.4',
  'При отсутствии письменного заявления одной из Сторон о прекращении Договора не позднее чем за 30 (тридцать) календарных дней до истечения срока его действия Договор считается продлённым на 12 (двенадцать) месяцев на прежних условиях.',
);

export const srcSupply203Quality = ref(
  'src-a-supply-203-quality',
  DOC.SUPPLY_203,
  ANCHOR.SUPPLY_203_QUALITY,
  'Договор поставки №203/П, п. 5.7',
  'Поставщик гарантирует соответствие качества Товара требованиям, установленным ГОСТ и Спецификацией, в течение 12 (двенадцати) месяцев с даты поставки.',
);

/* ─────────────────────────────────  Судебные дела  ──────────────────────────────────── */

export const srcA40Subject = ref(
  'src-a-a40-subject',
  DOC.CASE_A40_CLAIM,
  ANCHOR.A40_SUBJECT,
  `Иск по делу ${CASE.A40}, предмет иска`,
  'Истец просит взыскать с Ответчика задолженность по Договору поставки №118/П от 01.06.2025 за поставленный и принятый, но не оплаченный Товар, а также предусмотренную договором неустойку.',
);

export const srcA40Amount = ref(
  'src-a-a40-amount',
  DOC.CASE_A40_CLAIM,
  ANCHOR.A40_AMOUNT,
  `Иск по делу ${CASE.A40}, цена иска`,
  'Цена иска составляет 4 830 000 (четыре миллиона восемьсот тридцать тысяч) рублей 00 копеек, включая сумму основного долга и неустойку, начисленную по п. 6.1 Договора.',
);

export const srcA40RulingDate = ref(
  'src-a-a40-ruling-date',
  DOC.CASE_A40_RULING,
  ANCHOR.A40_RULING_DATE,
  'Определение суда от 02.07.2026, дата заседания',
  'Назначить судебное заседание по настоящему делу и вызвать в него лиц, участвующих в деле.',
);

export const srcA40RulingEvidence = ref(
  'src-a-a40-ruling-evidence',
  DOC.CASE_A40_RULING,
  ANCHOR.A40_RULING_EVIDENCE,
  'Определение суда от 02.07.2026, об истребовании доказательств',
  'Предложить Ответчику представить документы, подтверждающие факт и объём поставки Товара по Договору №118/П, включая акты приёма-передачи за спорный период.',
);

export const srcA40ResponseArg1 = ref(
  'src-a-a40-response-arg1',
  DOC.CASE_A40_RESPONSE,
  ANCHOR.A40_RESPONSE_ARG1,
  'Отзыв ответчика от 19.07.2026, довод о пропуске срока',
  'Ответчик полагает, что Истцом пропущен срок исковой давности по требованию о взыскании задолженности, поскольку обязанность по оплате поставленного Товара возникла более трёх лет до даты подачи искового заявления.',
);

export const srcA40ResponseArg2 = ref(
  'src-a-a40-response-arg2',
  DOC.CASE_A40_RESPONSE,
  ANCHOR.A40_RESPONSE_ARG2,
  'Отзыв ответчика от 19.07.2026, довод о качестве',
  'Ответчик также ссылается на несоответствие качества поставленного Товара условиям Спецификации, что, по его мнению, освобождает от обязанности по оплате в полном объёме.',
);

export const srcA41Subject = ref(
  'src-a-a41-subject',
  DOC.CASE_A41_CLAIM,
  ANCHOR.A41_SUBJECT,
  `Иск по делу ${CASE.A41}, предмет иска`,
  'Истец просит признать односторонний отказ Ответчика от исполнения Договора недействительным и обязать Ответчика возобновить исполнение обязательств в полном объёме.',
);

export const srcPractice14 = ref(
  'src-a-practice-14',
  DOC.PRACTICE_VS_2024,
  ANCHOR.PRACTICE_14,
  'Обзор практики ВС РФ №2 (2024), п. 14',
  'Течение срока исковой давности по требованию о взыскании задолженности по денежному обязательству с определённым сроком исполнения начинается со дня, следующего за днём, когда обязательство должно было быть исполнено, а не с момента составления акта сверки взаимных расчётов.',
);

export const srcA40ExpertConclusion = ref(
  'src-a-a40-expert-conclusion',
  DOC.CASE_A40_EXPERT,
  ANCHOR.A40_EXPERT_CONCLUSION,
  'Заключение эксперта от 21.07.2026, вывод',
  'Поставленный Товар по своим качественным характеристикам соответствует требованиям, установленным Спецификацией к Договору №118/П. Выявленные Ответчиком отклонения не носят существенного характера и не препятствуют использованию Товара по назначению.',
);
