/**
 * `evidence_request` — «Ходатайство об истребовании» (docs/SCENARIOS.md §4).
 *
 * Ни один сценарий мок-агента не строит карточки этого типа (нет
 * `buildEvidenceRequestCard` в `core/agent/scenarios/cards.ts`) — payload
 * целиком принадлежит этому файлу, свободная форма.
 */
import { useRef } from 'react';
import { FileSearch, Plus, X } from 'lucide-react';
import type { ActionCard, Id, IsoDateTime, TaskEvent } from '@/types/domain';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import { diffPayload } from '@/core/cards/diffPayload';
import { Button } from '@/shared/ui';
import styles from './cards.module.css';

export type EvidenceRequestItem = { what: string; from: string };

export type EvidenceRequestPayload = {
  caseId: Id;
  caseNumber: string;
  items: EvidenceRequestItem[];
  motionText: string;
  fileBy: IsoDateTime;
};

function Body({ payload }: { payload: EvidenceRequestPayload; card: ActionCard<EvidenceRequestPayload> }) {
  return (
    <div className={styles.body}>
      <ul className={styles.list}>
        {payload.items.map((item, index) => (
          <li key={index} className={styles.listItem}>
            <span className={styles.listItemHead}>{item.what}</span>
            <span className={styles.listItemFrom}>Истребовать у: {item.from}</span>
          </li>
        ))}
      </ul>
      <p className={styles.prose}>{payload.motionText}</p>
    </div>
  );
}

function EditForm({
  payload,
  onChange,
}: {
  payload: EvidenceRequestPayload;
  onChange: (next: EvidenceRequestPayload) => void;
}) {
  const originalRef = useRef(payload);
  const changed = diffPayload(originalRef.current, payload);

  function updateItem(index: number, next: Partial<EvidenceRequestItem>) {
    const items = payload.items.map((item, i) => (i === index ? { ...item, ...next } : item));
    onChange({ ...payload, items });
  }

  function removeItem(index: number) {
    onChange({ ...payload, items: payload.items.filter((_, i) => i !== index) });
  }

  function addItem() {
    onChange({ ...payload, items: [...payload.items, { what: '', from: '' }] });
  }

  return (
    <div className={styles.form} data-changed={changed.has('items') || undefined}>
      {payload.items.map((item, index) => (
        <div key={index} className={styles.itemRow} data-changed={changed.has('items') || undefined}>
          <div className={styles.itemFields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Что истребовать</span>
              <input
                className={styles.input}
                type="text"
                value={item.what}
                onChange={(e) => updateItem(index, { what: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>У кого</span>
              <input
                className={styles.input}
                type="text"
                value={item.from}
                onChange={(e) => updateItem(index, { from: e.target.value })}
              />
            </label>
          </div>
          <Button
            className={styles.removeRow}
            variant="ghost"
            size="sm"
            iconLeft={<X size={13} strokeWidth={1.75} aria-hidden="true" />}
            onClick={() => removeItem(index)}
          >
            Убрать
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Plus size={13} strokeWidth={1.75} aria-hidden="true" />}
        onClick={addItem}
      >
        Добавить пункт
      </Button>

      <label className={styles.field} data-changed={changed.has('motionText') || undefined}>
        <span className={styles.fieldLabel}>Текст ходатайства</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={payload.motionText}
          onChange={(e) => onChange({ ...payload, motionText: e.target.value })}
        />
      </label>
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Формирую текст ходатайства' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Проверяю перечень истребуемых доказательств' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 2, label: 'Готовлю к подаче в суд' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const evidenceRequestCardType: CardTypeDef<EvidenceRequestPayload> = {
  type: 'evidence_request',
  label: 'Ходатайство об истребовании',
  icon: FileSearch,
  Body,
  EditForm,
  execute,
};
