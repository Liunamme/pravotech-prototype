import { describe, expect, it } from 'vitest';
import type { CardTypeDef } from '@/workspaces/types';
import { evidenceRequestCardType } from '@/workspaces/litigation/cards';
import { obligationBreachCardType, paymentDueCardType, renewalNoticeCardType } from '@/workspaces/obligations/cards';
import {
  FIELD_LIMITS,
  FORM_ERROR_KEY,
  checkAmount,
  checkDeadline,
  checkText,
  hasErrors,
  validateCardDecision,
} from './validation';

describe('checkText', () => {
  it('требует непустой текст после trim', () => {
    expect(checkText('текст', { what: 'поле', max: 100 })).toBeUndefined();
    expect(checkText('', { what: 'поле', max: 100 })).toMatch(/Заполните/);
    expect(checkText('   ', { what: 'поле', max: 100 })).toMatch(/Заполните/);
    expect(checkText('\n\t ', { what: 'поле', max: 100 })).toMatch(/Заполните/);
    expect(checkText(undefined, { what: 'поле', max: 100 })).toMatch(/Заполните/);
  });

  it('ограничивает длину', () => {
    expect(checkText('a'.repeat(100), { what: 'поле', max: 100 })).toBeUndefined();
    expect(checkText('a'.repeat(101), { what: 'поле', max: 100 })).toMatch(/Слишком длинно/);
  });
});

describe('checkAmount', () => {
  it('пропускает осмысленные суммы', () => {
    expect(checkAmount(1)).toBeUndefined();
    expect(checkAmount(1_240_000.5)).toBeUndefined();
    expect(checkAmount(0.01)).toBeUndefined();
  });

  it('не даёт отправить платёж на ноль или пустую сумму', () => {
    // Пустое поле ввода приходит как NaN — раньше становилось нулём.
    expect(checkAmount(Number.NaN)).toMatch(/Укажите сумму/);
    expect(checkAmount(0)).toMatch(/больше нуля/);
    expect(checkAmount(-5)).toMatch(/больше нуля/);
    expect(checkAmount(Number.POSITIVE_INFINITY)).toMatch(/Укажите сумму/);
    expect(checkAmount('1000')).toMatch(/Укажите сумму/);
  });

  it('ловит ошибку в разрядах и лишние копейки', () => {
    expect(checkAmount(FIELD_LIMITS.amount + 1)).toMatch(/разряды/);
    expect(checkAmount(10.005)).toMatch(/двух знаков/);
  });
});

describe('checkDeadline', () => {
  it('принимает срок домена и отвергает несуществующую дату', () => {
    expect(checkDeadline('2026-07-24T09:15:00+03:00')).toBeUndefined();
    expect(checkDeadline('2026-02-30T09:15:00+03:00')).toMatch(/нет в календаре/);
    expect(checkDeadline('')).toMatch(/Укажите дату/);
    expect(checkDeadline(null)).toMatch(/Укажите дату/);
  });
});

describe('validateCardDecision', () => {
  const noRules: CardTypeDef<unknown> = renewalNoticeCardType as unknown as CardTypeDef<unknown>;

  it('отвергает payload, который вообще не объект', () => {
    for (const bad of ['строка', 42, null, ['массив']]) {
      const errors = validateCardDecision(noRules, bad);
      expect(errors[FORM_ERROR_KEY]).toBeDefined();
    }
  });

  it('уведомление о непролонгации: пустой текст и битая дата не проходят', () => {
    const ok = {
      contractTitle: 'Договор №44-АР',
      contractDocId: 'doc-lease-44',
      counterparty: 'ООО «Ромашка»',
      renewalDate: '2026-09-01T09:00:00+03:00',
      noticeDeadline: '2026-07-27T09:00:00+03:00',
      draftNotice: 'Уведомляем об отказе от пролонгации.',
    };
    expect(hasErrors(validateCardDecision(renewalNoticeCardType, ok))).toBe(false);
    expect(validateCardDecision(renewalNoticeCardType, { ...ok, draftNotice: '  ' }).draftNotice).toBeDefined();
    expect(
      validateCardDecision(renewalNoticeCardType, { ...ok, noticeDeadline: '2026-02-30T09:00:00+03:00' })
        .noticeDeadline,
    ).toBeDefined();
  });

  it('нарушение обязательства: требование и ответ обязательны', () => {
    const ok = { counterparty: 'ООО «Вектор»', claim: 'Повышение цены', draftResponse: 'Отказываем.' };
    expect(hasErrors(validateCardDecision(obligationBreachCardType, ok))).toBe(false);
    expect(validateCardDecision(obligationBreachCardType, { ...ok, claim: '' }).claim).toBeDefined();
    expect(validateCardDecision(obligationBreachCardType, { ...ok, draftResponse: '' }).draftResponse).toBeDefined();
  });

  it('платёж: сумма и срок', () => {
    const ok = {
      contractId: 'doc-supply-118',
      invoiceNumber: 'СЧ-1',
      amount: 1000,
      currency: 'RUB',
      dueDate: '2026-08-01T09:00:00+03:00',
      payee: 'ООО «Ромашка»',
    };
    expect(hasErrors(validateCardDecision(paymentDueCardType, ok))).toBe(false);
    expect(validateCardDecision(paymentDueCardType, { ...ok, amount: 0 }).amount).toBeDefined();
    expect(validateCardDecision(paymentDueCardType, { ...ok, amount: Number.NaN }).amount).toBeDefined();
  });

  it('ходатайство: перечень не пустой, пункты заполнены, лимит соблюдён', () => {
    const ok = {
      caseId: 'case-a40',
      caseNumber: 'А40-118742/26',
      items: [{ what: 'Договор поставки', from: 'ООО «Вектор»' }],
      motionText: 'Просим истребовать.',
      fileBy: '2026-08-05T09:00:00+03:00',
    };
    expect(hasErrors(validateCardDecision(evidenceRequestCardType, ok))).toBe(false);

    expect(validateCardDecision(evidenceRequestCardType, { ...ok, items: [] }).items).toMatch(/хотя бы один/);

    const withEmptyItem = { ...ok, items: [{ what: '', from: 'ООО «Вектор»' }] };
    expect(validateCardDecision(evidenceRequestCardType, withEmptyItem)['items[0].what']).toBeDefined();

    const tooMany = {
      ...ok,
      items: Array.from({ length: FIELD_LIMITS.items + 1 }, () => ({ what: 'Документ', from: 'Контрагент' })),
    };
    expect(validateCardDecision(evidenceRequestCardType, tooMany).items).toMatch(/Не больше/);
  });
});
