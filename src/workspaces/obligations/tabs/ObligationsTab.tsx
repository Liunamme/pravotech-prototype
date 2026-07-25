/**
 * Вкладка контекста «Обязательства» (docs/DOMAIN.md §8, `ContextTabDef`).
 *
 * Не дубль очереди карточек: очередь группирует по приоритету и раскрывает
 * P0/P1 по умолчанию (docs/UX.md §2-3) — здесь плоский список «что и к
 * какому сроку» по всему портфелю пространства, отсортированный строго по
 * сроку, с колонкой типа обязательства вместо приоритета. Годится, чтобы
 * быстро окинуть взглядом весь список дел без раскрытия карточек.
 */
import { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import type { ActionCard, Id } from '@/types/domain';
import { useStore } from '@/store';
import { getCardType } from '@/workspaces/registry';
import { EmptyState } from '@/shared/ui';
import { formatDeadline } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import styles from './ObligationsTab.module.css';

function byDueAt(a: ActionCard, b: ActionCard): number {
  const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
  return aDue - bDue;
}

export function ObligationsTab({ workspaceId }: { workspaceId: Id }) {
  const cards = useStore((state) => state.cards);

  const rows = useMemo(
    () =>
      Object.values(cards)
        .filter((card) => card.workspaceId === workspaceId && card.state === 'pending')
        .sort(byDueAt),
    [cards, workspaceId],
  );

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          icon={ListChecks}
          title="Открытых обязательств нет"
          description="Здесь появятся пункты, которые требуют действия по договорам этого пространства."
        />
      </div>
    );
  }

  return (
    <div className={styles.root} role="table" aria-label="Обязательства по портфелю">
      {rows.map((card) => {
        const cardType = getCardType(card.workspaceId, card.type);
        const Icon = cardType?.icon ?? ListChecks;
        const deadline = card.dueAt ? formatDeadline(card.dueAt) : null;

        return (
          <div key={card.id} className={styles.row} role="row">
            <span className={styles.icon} aria-hidden="true">
              <Icon size={15} strokeWidth={1.75} />
            </span>
            <div className={styles.main}>
              <span className={styles.title}>{card.title}</span>
              {cardType && <span className={styles.typeLabel}>{cardType.label}</span>}
            </div>
            {deadline && <span className={cn(styles.due, styles[`due_${deadline.urgency}`])}>{deadline.text}</span>}
          </div>
        );
      })}
    </div>
  );
}
