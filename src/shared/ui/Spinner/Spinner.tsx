import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md';

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize;
};

/**
 * Индикатор загрузки. Сам по себе не несёт смысла для скринридера —
 * `aria-hidden` всегда включён, текстовый статус даёт вызывающий код.
 */
export function Spinner({ size = 'md', className, ...rest }: SpinnerProps) {
  return (
    <span
      className={cn(styles.root, styles[`size_${size}`], className)}
      aria-hidden="true"
      {...rest}
    />
  );
}
