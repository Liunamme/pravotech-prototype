/**
 * `hearing_prep` — «Подготовка к заседанию» (docs/SCENARIOS.md §4).
 *
 * `P` = `HearingPrepPayload` из `core/agent/scenarios/cards.ts` — эти
 * карточки реально эмитятся сценариями `morningDigest` и `casePosition`
 * (`buildHearingPrepCard`), payload там — `{ caseNumber, hearingAt, summary }`
 * (позиция как единая строка, не массив тезисов) — тело подстроено под
 * этот реальный контракт, а не под произвольную форму (см. тот же довод в
 * `renewalNotice.tsx`). Без `EditForm`: правка целой позиции построчной
 * формой в компактной карточке очереди не читается лучше диалога с
 * агентом — решение сохранить/оспорить принимается через «Изменить» нельзя
 * (кнопка скрыта самим контрактом `CardTypeDef` при отсутствии формы),
 * что здесь осознанно: тезисы обсуждаются в чате, карточка лишь фиксирует
 * готовность.
 */
import { ClipboardList } from 'lucide-react';
import type { ActionCard, TaskEvent } from '@/types/domain';
import type { HearingPrepPayload } from '@/core/agent/scenarios/cards';
import type { CardTypeDef } from '@/workspaces/types';
import { sleep, statusStepDelay } from '@/core/agent/timing';
import { formatDateTime } from '@/shared/lib/date';
import styles from './cards.module.css';

/** «11:00» — время заседания отдельно от даты: дату уже показывает срок в шапке карточки. */
function hearingTime(hearingAt: string): string {
  const time = formatDateTime(hearingAt).split(', ')[1];
  return time ?? '';
}

/**
 * `HearingPrepPayload.summary` — одна строка прозы (реальный контракт
 * мок-агента, см. комментарий файла), но по смыслу это перечень тезисов
 * позиции, обычно по одному на предложение (`casePosition`/`morningDigest`
 * формулируют её ровно так — «Довод... отклоняется... Довод... опровергается
 * заключением эксперта»). Разбиваем по границе предложения, чтобы показать
 * тезисы списком (docs UX п. 6.3 задания), не выдумывая поле, которого нет
 * в реальном payload.
 */
function positionPoints(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((point) => point.trim())
    .filter(Boolean);
}

function Body({ payload }: { payload: HearingPrepPayload; card: ActionCard<HearingPrepPayload> }) {
  const points = positionPoints(payload.summary);

  return (
    <div className={styles.body}>
      <span className={styles.timeChip}>Заседание в {hearingTime(payload.hearingAt)}</span>
      {points.length > 1 ? (
        <ul className={styles.list}>
          {points.map((point, index) => (
            <li key={index} className={styles.listItem}>
              {point}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.prose}>{payload.summary}</p>
      )}
    </div>
  );
}

async function* execute(): AsyncIterable<TaskEvent> {
  yield { t: 'step', index: 0, label: 'Проверяю комплект документов к заседанию' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 1, label: 'Сверяю позицию с материалами дела' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 2, label: 'Формирую комплект для заседания' };
  await sleep(statusStepDelay());
  yield { t: 'step', index: 3, label: 'Уведомляю ответственных о готовности' };
  await sleep(statusStepDelay());
  yield { t: 'succeeded' };
}

export const hearingPrepCardType: CardTypeDef<HearingPrepPayload> = {
  type: 'hearing_prep',
  label: 'Подготовка к заседанию',
  icon: ClipboardList,
  Body,
  execute,
};
