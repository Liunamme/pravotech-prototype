import type { HTMLAttributes } from 'react';
import type { Priority } from '@/types/domain';
import { cn } from '@/shared/lib/cn';
import styles from './PriorityBadge.module.css';

const PRIORITY_DESCRIPTION: Record<Priority, string> = {
  P0: 'Критический приоритет',
  P1: 'Высокий приоритет',
  P2: 'Средний приоритет',
  P3: 'Низкий приоритет',
};

type PriorityBadgeBaseProps = Omit<HTMLAttributes<HTMLSpanElement>, 'title'> & {
  priority: Priority;
};

/**
 * `showLabel` управляет видимой меткой `P0`…`P3`. Если её скрыть, `title`
 * становится обязательным на уровне типов — иначе приоритет останется
 * закодирован только цветом/плотностью заливки, что запрещено SPEC (a11y).
 */
export type PriorityBadgeProps =
  | (PriorityBadgeBaseProps & { showLabel?: true; title?: string })
  | (PriorityBadgeBaseProps & { showLabel: false; title: string });

/**
 * Приоритет всегда кодируется тремя независимыми сигналами: цветом,
 * текстовой меткой и плотностью заливки (P0 — сплошная, P1/P2 — подложка
 * + рамка, P3 — только рамка). Один цвет недостаточен для дальтоников.
 */
export function PriorityBadge(props: PriorityBadgeProps) {
  const { priority, showLabel = true, title, className, ...rest } = props;

  return (
    <span
      className={cn(styles.root, styles[`priority_${priority}`], !showLabel && styles.dotOnly, className)}
      title={title}
      aria-label={!showLabel ? title : undefined}
      {...rest}
    >
      {showLabel && priority}
    </span>
  );
}

export { PRIORITY_DESCRIPTION };
