/**
 * `obligation_breach` — «Нарушение обязательства» (docs/SCENARIOS.md §4).
 *
 * `P` = `ObligationBreachPayload` из `core/agent/scenarios/cards.ts` — эти
 * карточки реально эмитятся сценарием `priceIncreaseRefusal` (и
 * `morningDigest`) через `buildVektorPriceCard`, форма тела обязана
 * соответствовать этому payload (см. комментарий `renewalNotice.tsx`).
 */
import { useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { ActionCard, TaskEvent } from '@/types/domain';
import type { ObligationBreachPayload } from '@/core/agent/scenarios/cards';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import { diffPayload } from '@/core/cards/diffPayload';
import styles from './cards.module.css';

function Body({ payload }: { payload: ObligationBreachPayload; card: ActionCard<ObligationBreachPayload> }) {
  return (
    <div className={styles.body}>
      <dl className={styles.factRow}>
        <div className={styles.fact}>
          <dt>Контрагент</dt>
          <dd>{payload.counterparty}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Требование</dt>
          <dd>{payload.claim}</dd>
        </div>
      </dl>
      <p className={styles.draft}>{payload.draftResponse}</p>
    </div>
  );
}

function EditForm({
  payload,
  onChange,
}: {
  payload: ObligationBreachPayload;
  onChange: (next: ObligationBreachPayload) => void;
}) {
  const originalRef = useRef(payload);
  const changed = diffPayload(originalRef.current, payload);

  return (
    <div className={styles.form}>
      <label className={styles.field} data-changed={changed.has('claim') || undefined}>
        <span className={styles.fieldLabel}>Требование контрагента</span>
        <textarea
          className={styles.textarea}
          rows={2}
          value={payload.claim}
          onChange={(e) => onChange({ ...payload, claim: e.target.value })}
        />
      </label>
      <label className={styles.field} data-changed={changed.has('draftResponse') || undefined}>
        <span className={styles.fieldLabel}>Текст ответа</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={payload.draftResponse}
          onChange={(e) => onChange({ ...payload, draftResponse: e.target.value })}
        />
      </label>
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Формирую текст ответа' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Проверяю ссылки на условия договора' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 2, label: 'Ставлю в очередь на отправку контрагенту' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const obligationBreachCardType: CardTypeDef<ObligationBreachPayload> = {
  type: 'obligation_breach',
  label: 'Нарушение обязательства',
  icon: ShieldAlert,
  Body,
  EditForm,
  execute,
};
