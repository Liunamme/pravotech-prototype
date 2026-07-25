import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './HighlightAnchor.module.css';

export type HighlightPhase = 'idle' | 'flash' | 'settled';

export type HighlightAnchorProps = {
  /** Это блок, на который сейчас указывает открытый якорь инспектора. */
  active: boolean;
  /**
   * `true` — подсвечивается весь блок (нет `charStart`/`charEnd` у якоря).
   * `false` — подсветку несёт только вложенный `<HighlightMark>`, сам блок
   * остаётся прозрачным (docs/DOMAIN.md §2: подсветка внутри блока).
   */
  highlightWhole?: boolean;
  children: ReactNode;
  className?: string;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Переход к якорю документа (docs/UX.md §4): при открытии нужный фрагмент
 * прокручивается В ЦЕНТР вьюпорта (`block: 'center'`, не к верхнему краю —
 * юристу нужен контекст вокруг пункта), подсветка заливкой
 * `--color-warning-subtle` плавно затухает за 1,2с до `--color-accent-subtle`,
 * которая остаётся, пока инспектор открыт. `prefers-reduced-motion` —
 * конечное состояние сразу, без промежуточной вспышки и без плавной прокрутки.
 *
 * Двухфазный переход (`flash` → `settled` через два `requestAnimationFrame`)
 * — стандартный приём, чтобы браузер успел отрисовать исходный цвет ДО
 * начала CSS-перехода к конечному: иначе оба класса применились бы в одном
 * кадре и transition не на чем было бы анимировать.
 */
export function HighlightAnchor({ active, highlightWhole = true, children, className }: HighlightAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<HighlightPhase>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    const reduced = prefersReducedMotion();
    const node = ref.current;
    if (node) {
      node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }

    if (reduced) {
      setPhase('settled');
      return;
    }

    setPhase('flash');
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('settled'));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [active]);

  return (
    <div
      ref={ref}
      data-phase={phase}
      className={cn(styles.root, highlightWhole && styles.highlightWhole, className)}
    >
      {children}
    </div>
  );
}

/** Подсветка подстроки внутри блока (`DocAnchor.charStart/charEnd`) — используется рядом с `HighlightAnchor` того же блока. */
export function HighlightMark({ children }: { children: ReactNode }) {
  return <mark className={styles.mark}>{children}</mark>;
}
