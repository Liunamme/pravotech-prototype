import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import styles from './EmptyState.module.css';

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Кнопка/ссылка действия — например «Создать первый чат». */
  action?: ReactNode;
};

/**
 * Пустое состояние — не заглушка, а рабочая точка входа: иконка задаёт
 * контекст, заголовок называет ситуацию, описание объясняет, действие
 * даёт следующий шаг. Используется и для «ничего не найдено», и для
 * «здесь пока пусто, но вот с чего начать».
 */
export function EmptyState({ icon: Icon, title, description, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cn(styles.root, className)} {...rest}>
      <div className={styles.iconWrap} aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
