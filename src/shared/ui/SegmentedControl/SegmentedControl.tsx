import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './SegmentedControl.module.css';

export type SegmentedControlOption = {
  value: string;
  label: string;
  /** Опциональный счётчик рядом с подписью, например «Очередь 7». */
  count?: number;
};

export type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label': string;
};

/**
 * Переключатель на своём `role="tablist"`/`role="tab"` (не Radix Tabs) —
 * см. обоснование в отчёте агента: здесь нет связанной панели контента,
 * это чистый селектор режима отображения соседнего списка, а не набор
 * вкладок с раздельным содержимым. Роутинг фокуса — по стрелкам,
 * активация — автоматическая (как у нативного macOS segmented control).
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = 'md',
  className,
  ...rest
}: SegmentedControlProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAndSelect(index: number) {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    refs.current[option.value]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = options.findIndex((option) => option.value === value);
    if (currentIndex === -1) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusAndSelect((currentIndex + 1) % options.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusAndSelect((currentIndex - 1 + options.length) % options.length);
        break;
      case 'Home':
        event.preventDefault();
        focusAndSelect(0);
        break;
      case 'End':
        event.preventDefault();
        focusAndSelect(options.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="tablist"
      className={cn(styles.root, styles[`size_${size}`], className)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[option.value] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={cn(styles.segment, isSelected && styles.active)}
            onClick={() => onValueChange(option.value)}
          >
            <span>{option.label}</span>
            {option.count !== undefined && <span className={styles.count}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
