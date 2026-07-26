import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { IconButton } from '@/shared/ui';
import styles from './QueueDrawer.module.css';

export type QueueDrawerProps = {
  /**
   * `false` — обычная правая колонка (десктоп), `true` — выдвижная панель
   * поверх рабочей области (планшет). Решение принимает страница, а не сам
   * компонент: судьбу колонок по контракту определяет `core/layout`
   * (docs/UX.md §8).
   */
  asDrawer: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Узел стеклянной плашки `main` — панель выезжает внутри неё, а не от края окна. */
  container: HTMLElement | null;
  /** Класс обычной колонки в десктопной раскладке. */
  columnClassName?: string;
  children: ReactNode;
};

/**
 * Очередь и сроки: справа колонкой на десктопе, выдвижной панелью на планшете.
 *
 * На 768–1279px три колонки не помещаются — чат сжимался бы до нечитаемой
 * полосы. Поэтому очередь уезжает в панель поверх рабочей области, а её место
 * забирает чат (docs/UX.md §8, макет `pravotex-adaptive.dc.html`, раскладка
 * `tablet`).
 *
 * Устроена по образцу `DocumentInspector`, и по тем же причинам:
 *
 * • `position: absolute` внутри `main`, а не `fixed` от вьюпорта — панель
 *   принадлежит рабочей области и не должна наезжать на рейку и сайдбар;
 * • `modal={false}` — это слайд-овер, а не модалка. В modal-режиме Radix
 *   блокирует прокрутку body и компенсирует ширину скроллбара паддингом,
 *   из-за чего весь интерфейс дёргается вбок при открытии;
 * • стекло — отдельным инертным слоем (`.glass`), а не фоном панели:
 *   `backdrop-filter` делает элемент backdrop root, и composer Chromium
 *   перестаёт считать его целью колеса мыши — прокрутка проваливалась бы
 *   в то, что лежит под панелью;
 * • `onInteractOutside` погашен намеренно: кнопка-переключатель живёт снаружи
 *   панели, и без этого её нажатие сначала закрывало бы панель как «клик
 *   мимо», а потом открывало заново. Закрывают крестик и `Esc`.
 */
export function QueueDrawer({
  asDrawer,
  open,
  onOpenChange,
  container,
  columnClassName,
  children,
}: QueueDrawerProps) {
  if (!asDrawer) {
    return <div className={columnClassName}>{children}</div>;
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Content
          className={styles.content}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <RadixDialog.Title className={styles.visuallyHidden}>Очередь и сроки</RadixDialog.Title>

          {/* Декоративное стекло. Отдельным слоем и без ввода — см. комментарий файла. */}
          <div className={styles.glass} aria-hidden="true" />

          {/* Содержимое лежит НАД стеклом: оба слоя позиционированы, порядок в DOM решает. */}
          <div className={styles.closeRow}>
            <RadixDialog.Close asChild>
              <IconButton className={styles.close} variant="ghost" size="sm" aria-label="Закрыть очередь">
                <X size={15} strokeWidth={2} />
              </IconButton>
            </RadixDialog.Close>
          </div>

          <div className={styles.body}>{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
