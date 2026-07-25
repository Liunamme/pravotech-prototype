import { useId, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Skeleton.module.css';

export type SkeletonRadius = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
  radius?: SkeletonRadius;
  /** Сколько строк-заглушек отрисовать подряд (с отступом между ними). */
  count?: number;
};

/**
 * Заглушка загрузки на градиенте. Уважает `prefers-reduced-motion`: при
 * reduce анимация отключается, остаётся статичная заливка (см. media-запрос
 * ниже; общий `reset.css` уже гасит длительность, здесь — явное дублирование
 * ради читаемости контракта компонента).
 */
export function Skeleton({
  width,
  height = 16,
  radius = 'sm',
  count = 1,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const itemStyle: CSSProperties = { width, height, ...style };
  const baseId = useId();

  if (count <= 1) {
    return (
      <div
        className={cn(styles.root, styles[`radius_${radius}`], className)}
        style={itemStyle}
        {...rest}
      />
    );
  }

  const ids = Array.from({ length: count }, (_, index) => `${baseId}-${index}`);

  return (
    <div className={styles.stack} {...rest}>
      {ids.map((id) => (
        <div
          key={id}
          className={cn(styles.root, styles[`radius_${radius}`], className)}
          style={itemStyle}
        />
      ))}
    </div>
  );
}
