/**
 * `filing_deadline` — «Процессуальный срок» (docs/SCENARIOS.md §4).
 *
 * `destructive: true` — подача в суд необратима: `ActionCardShell` вместо
 * undo-тоста показывает подтверждающий `Dialog` (docs/UX.md §2, «Undo
 * вместо подтверждения», исключение). Ровно то расхождение с
 * `renewal_notice`/`obligation_breach`/`payment_due` (все — undo), которое
 * должно доказать: механизм различает обратимые и необратимые действия
 * (задание этапа 6, п. 6.4).
 *
 * `P` = `FilingDeadlinePayload` из `core/agent/scenarios/cards.ts` — эти
 * карточки реально эмитятся сценарием `morningDigest`
 * (`buildFilingDeadlineCard`), payload там — `{ caseNumber, summary }`
 * (см. тот же довод в `renewalNotice.tsx`). Без `EditForm` — по контракту
 * `CardTypeDef` (`workspaces/types.ts`) это само по себе скрывает кнопку
 * «Изменить»: процессуальный документ либо подаётся как есть, либо
 * отклоняется, промежуточная правка на месте не предусмотрена сценарием.
 */
import { Send } from 'lucide-react';
import type { ActionCard, TaskEvent } from '@/types/domain';
import type { FilingDeadlinePayload } from '@/core/agent/scenarios/cards';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import styles from './cards.module.css';

function Body({ payload }: { payload: FilingDeadlinePayload; card: ActionCard<FilingDeadlinePayload> }) {
  return (
    <div className={styles.body}>
      <p className={styles.prose}>{payload.summary}</p>
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Формирую итоговый документ' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Проверяю комплект приложений' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 2, label: 'Подаю в систему электронного правосудия' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const filingDeadlineCardType: CardTypeDef<FilingDeadlinePayload> = {
  type: 'filing_deadline',
  label: 'Процессуальный срок',
  icon: Send,
  Body,
  destructive: true,
  confirmLabel: 'Подать',
  execute,
};
