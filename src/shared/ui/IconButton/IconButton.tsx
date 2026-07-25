import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './IconButton.module.css';

export type IconButtonVariant = 'ghost' | 'secondary' | 'primary' | 'danger';
export type IconButtonSize = 'sm' | 'md';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Обязателен — кнопка icon-only, скринридеру больше не за что зацепиться. */
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
};

/**
 * Кнопка-иконка. `aria-label` — обязательный проп (не опциональный) именно
 * потому, что без текстовой подписи это единственное описание для a11y-дерева.
 * Хит-зона держится ≥32×32 в плотном режиме за счёт паддинга вокруг иконки,
 * даже если сама иконка меньше.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.root, styles[`variant_${variant}`], styles[`size_${size}`], className)}
      {...rest}
    >
      {children}
    </button>
  );
});
