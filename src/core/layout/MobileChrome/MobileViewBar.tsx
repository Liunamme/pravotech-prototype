import type { ReactNode } from 'react';
import { SegmentedControl, type SegmentedControlOption } from '@/shared/ui';
import styles from './MobileViewBar.module.css';

export type MobileViewBarProps = {
  /** Заголовок экрана — «Сегодня» или название пространства. */
  title: string;
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Кнопка «Очередь» справа от переключателя. */
  action?: ReactNode;
  /** Действие слева от заголовка — на пространстве это список диалогов. */
  leading?: ReactNode;
};

/**
 * Шапка мобильного экрана: заголовок, переключатель вида и кнопка очереди
 * (макет `pravotex-adaptive.dc.html`, раскладка `mobile`).
 *
 * На телефоне колонок нет вовсе — вместо них по одной поверхности за раз, и
 * переключатель заменяет собой то, что на десктопе видно одновременно. Он же
 * повторяет привычную с десктопа пару «Очередь · Сроки», только очередь
 * вынесена в отдельную кнопку: она открывается поверх, а не вместо, — юрист
 * должен видеть её, не теряя переписку.
 *
 * Переключатель прокручивается по горизонтали: в пространстве вкладок
 * четыре («Диалог», две вкладки контекста, «Сроки»), и на 375px они в строку
 * не помещаются. Обрезать подписи нельзя — «Обяз…» не опознаётся.
 */
export function MobileViewBar({ title, options, value, onValueChange, action, leading }: MobileViewBarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        {leading}
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.controls}>
        <div className={styles.segments}>
          <SegmentedControl
            aria-label="Что показать на экране"
            size="sm"
            options={options}
            value={value}
            onValueChange={onValueChange}
          />
        </div>
        {action}
      </div>
    </div>
  );
}
