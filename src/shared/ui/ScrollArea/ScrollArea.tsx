import { useRef, useState, type HTMLAttributes, type UIEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './ScrollArea.module.css';

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement>;

/**
 * Тонкая обёртка над `composes: scrollArea` (SPEC 4) с необязательными
 * тенями-индикаторами прокрутки сверху/снизу — подсказывают, что список
 * длиннее видимой области, без постоянно видимого скроллбара.
 */
export function ScrollArea({ className, onScroll, children, ...rest }: ScrollAreaProps) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  function updateEdges(el: HTMLDivElement) {
    setAtTop(el.scrollTop <= 0);
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    onScroll?.(event);
    updateEdges(event.currentTarget);
  }

  return (
    <div className={styles.wrap}>
      <div className={cn(styles.topShadow, !atTop && styles.visible)} aria-hidden="true" />
      <div ref={ref} className={cn(styles.root, className)} onScroll={handleScroll} {...rest}>
        {children}
      </div>
      <div className={cn(styles.bottomShadow, !atBottom && styles.visible)} aria-hidden="true" />
    </div>
  );
}
