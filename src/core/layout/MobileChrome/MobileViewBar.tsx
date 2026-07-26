import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './MobileViewBar.module.css';

export type MobileViewOption = {
  value: string;
  label: string;
};

export type MobileViewBarProps = {
  /** Заголовок экрана — «Сегодня» или название пространства. */
  title: string;
  options: MobileViewOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Кнопка «Очередь» — в правом конце строки заголовка. */
  action?: ReactNode;
  /** Действие слева от заголовка — на пространстве это список диалогов. */
  leading?: ReactNode;
};

/**
 * Шапка мобильного экрана: заголовок, лента вкладок и кнопка очереди
 * (макет `pravotex-adaptive.dc.html`, раскладка `mobile`).
 *
 * На телефоне колонок нет вовсе — вместо них по одной поверхности за раз, и
 * лента заменяет то, что на десктопе видно одновременно.
 *
 * Кнопка очереди стоит в строке заголовка: справа от него всё равно пусто, а
 * лента вкладок ниже получает всю ширину — иначе она обрывалась бы уже на
 * второй вкладке.
 *
 * Лента не рисуется вовсе, когда переключать нечего: на «Сегодня» осталась
 * одна поверхность («Диалог»), а вкладка в единственном числе — это не выбор,
 * а украшение, которое отнимает строку у переписки.
 *
 * Вкладки — отдельные «таблетки», а не слитный сегментный переключатель, как
 * на десктопе. Причина не в украшательстве: сегментный контрол — это выбор из
 * фиксированного набора, он обязан помещаться целиком. Здесь набор
 * переменный (в пространстве вкладок четыре, и их подписи задаёт манифест),
 * лента прокручивается, и слитная дорожка обрывалась бы посреди сегмента —
 * получалась бы «половина кнопки», которую видно на скриншоте заказчика.
 * Отдельные таблетки обрываются по границе элемента, а край растворяется
 * маской, а не режется.
 *
 * Клавиатура: стрелки перемещают выбор по ленте, как в сегментном контроле,
 * — на телефоне это нужно внешней клавиатуре и экранному диктору.
 */
export function MobileViewBar({ title, options, value, onValueChange, action, leading }: MobileViewBarProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAndSelect(index: number) {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    refs.current[option.value]?.focus();
    refs.current[option.value]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.value === value);
    if (index === -1) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAndSelect((index + 1) % options.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAndSelect((index - 1 + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusAndSelect(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusAndSelect(options.length - 1);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        {leading}
        <h1 className={styles.title}>{title}</h1>
        {action}
      </div>

      {options.length > 1 && (
        <div className={styles.scroller}>
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- фокус держат сами вкладки (roving tabindex) */}
          <div className={styles.tabs} role="tablist" aria-label="Что показать на экране" onKeyDown={handleKeyDown}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    refs.current[option.value] = node;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={cn(styles.tab, active && styles.tabActive)}
                  onClick={() => onValueChange(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
