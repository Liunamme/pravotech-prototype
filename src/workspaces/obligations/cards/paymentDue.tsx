/**
 * `payment_due` — «Платёж по договору» (docs/SCENARIOS.md §4).
 *
 * В отличие от `renewal_notice`/`obligation_breach`, ни один сценарий
 * мок-агента (`core/agent/scenarios/cards.ts`) этот тип карточки не
 * эмитит — он существует только в сиде пространства (этап 8 может завести
 * сценарий, который его строит, но контракт `PaymentDuePayload` тогда уже
 * будет здесь). Поэтому payload — собственный тип этого файла, без
 * оглядки на чужую форму.
 */
import { useRef } from 'react';
import { Banknote } from 'lucide-react';
import type { ActionCard, Id, IsoDateTime, TaskEvent } from '@/types/domain';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import { diffPayload } from '@/core/cards/diffPayload';
import { toDateInputValue, withNewDate } from './dateInput';
import styles from './cards.module.css';

export type PaymentDuePayload = {
  contractId: Id;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: IsoDateTime;
  payee: string;
};

/** «1 240 000,00 ₽» — группировка разрядов + символ валюты через `Intl`, `tabular-nums` — в CSS. */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function Body({ payload }: { payload: PaymentDuePayload; card: ActionCard<PaymentDuePayload> }) {
  return (
    <div className={styles.body}>
      <p className={styles.amount}>{formatAmount(payload.amount, payload.currency)}</p>
      <dl className={styles.factRow}>
        <div className={styles.fact}>
          <dt>Счёт</dt>
          <dd>{payload.invoiceNumber}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Получатель</dt>
          <dd>{payload.payee}</dd>
        </div>
      </dl>
    </div>
  );
}

function EditForm({
  payload,
  onChange,
}: {
  payload: PaymentDuePayload;
  onChange: (next: PaymentDuePayload) => void;
}) {
  const originalRef = useRef(payload);
  const changed = diffPayload(originalRef.current, payload);

  return (
    <div className={styles.form}>
      <div className={styles.formRow}>
        <label className={styles.field} data-changed={changed.has('amount') || undefined}>
          <span className={styles.fieldLabel}>Сумма, {payload.currency}</span>
          <input
            className={styles.input}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={payload.amount}
            onChange={(e) => onChange({ ...payload, amount: Number(e.target.value) || 0 })}
          />
        </label>
        <label className={styles.field} data-changed={changed.has('dueDate') || undefined}>
          <span className={styles.fieldLabel}>Срок оплаты</span>
          <input
            className={styles.input}
            type="date"
            value={toDateInputValue(payload.dueDate)}
            onChange={(e) => onChange({ ...payload, dueDate: withNewDate(payload.dueDate, e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Проверяю реквизиты платежа' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Ставлю платёж в очередь на согласование' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const paymentDueCardType: CardTypeDef<PaymentDuePayload> = {
  type: 'payment_due',
  label: 'Платёж по договору',
  icon: Banknote,
  Body,
  EditForm,
  execute,
};
