/**
 * `renewal_notice` — «Уведомление о непролонгации» (docs/SCENARIOS.md §4).
 *
 * `P` — не собственный тип: карточки этого типа реально приходят из мок-
 * агента (`buildRenewal44Card`/`27`/`203` в `core/agent/scenarios/cards.ts`,
 * запускаются сценариями `morningDigest`/`autoRenewalScan`), поэтому payload
 * обязан структурно совпадать с `RenewalNoticePayload` оттуда — иначе форма
 * тела разъедется с тем, что реально кладёт в карточку транспорт. Импорт
 * типа, не значения — `core/agent/**` не редактируется, только читается.
 */
import { useRef } from 'react';
import { FileSignature } from 'lucide-react';
import type { ActionCard, TaskEvent } from '@/types/domain';
import type { RenewalNoticePayload } from '@/core/agent/scenarios/cards';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import { formatDate } from '@/shared/lib/date';
import { diffPayload } from '@/core/cards/diffPayload';
import { toDateInputValue, withNewDate } from './dateInput';
import styles from './cards.module.css';

function Body({ payload }: { payload: RenewalNoticePayload; card: ActionCard<RenewalNoticePayload> }) {
  return (
    <div className={styles.body}>
      <dl className={styles.factRow}>
        <div className={styles.fact}>
          <dt>Контрагент</dt>
          <dd>{payload.counterparty}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Если не уведомить, продлится до</dt>
          <dd>{formatDate(payload.renewalDate)}</dd>
        </div>
      </dl>
      <p className={styles.draft}>{payload.draftNotice}</p>
    </div>
  );
}

/**
 * Подсветка изменённого поля относительно предложения агента (docs/UX.md
 * §2). `EditForm` получает только текущее `payload`/`onChange` — без
 * отдельного поля под «оригинал» (фиксированный контракт `CardTypeDef`).
 * Приём: `ActionCardShell` сбрасывает `editedPayload` на `card.payload`
 * при каждом входе в режим правки, поэтому значение первого рендера формы
 * и есть предложение агента — достаточно захватить его `useRef`.
 */
function EditForm({
  payload,
  onChange,
}: {
  payload: RenewalNoticePayload;
  onChange: (next: RenewalNoticePayload) => void;
}) {
  const originalRef = useRef(payload);
  const changed = diffPayload(originalRef.current, payload);

  return (
    <div className={styles.form}>
      <label className={styles.field} data-changed={changed.has('noticeDeadline') || undefined}>
        <span className={styles.fieldLabel}>Срок направления уведомления</span>
        <input
          className={styles.input}
          type="date"
          value={toDateInputValue(payload.noticeDeadline)}
          onChange={(e) => onChange({ ...payload, noticeDeadline: withNewDate(payload.noticeDeadline, e.target.value) })}
        />
      </label>
      <label className={styles.field} data-changed={changed.has('draftNotice') || undefined}>
        <span className={styles.fieldLabel}>Текст уведомления</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={payload.draftNotice}
          onChange={(e) => onChange({ ...payload, draftNotice: e.target.value })}
        />
      </label>
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Формирую уведомление' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Проверяю реквизиты' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 2, label: 'Ставлю в очередь на отправку' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const renewalNoticeCardType: CardTypeDef<RenewalNoticePayload> = {
  type: 'renewal_notice',
  label: 'Уведомление о непролонгации',
  icon: FileSignature,
  Body,
  EditForm,
  execute,
};
