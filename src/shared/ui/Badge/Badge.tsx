import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

/** Подложка `-subtle`, текст базовым цветом статуса, рамка `-border` (SPEC 3). */
export function Badge({ variant = 'neutral', size = 'md', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(styles.root, styles[`variant_${variant}`], styles[`size_${size}`], className)}
      {...rest}
    >
      {children}
    </span>
  );
}
