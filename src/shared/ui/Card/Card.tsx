import { forwardRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'raised' | 'interactive';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

/** Поверхность-контейнер: `--color-surface`, рамка, `radius-lg`, `shadow-sm`. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, onClick, onKeyDown, ...rest },
  ref,
) {
  const isInteractive = variant === 'interactive';

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (!isInteractive || !onClick || event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      (event.currentTarget as HTMLDivElement).click();
    }
  }

  return (
    <div
      ref={ref}
      className={cn(styles.root, styles[`variant_${variant}`], className)}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : onKeyDown}
      role={isInteractive && onClick ? 'button' : undefined}
      tabIndex={isInteractive && onClick ? 0 : undefined}
      {...rest}
    />
  );
});
