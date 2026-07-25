import { useCallback, type UIEvent } from 'react';

/**
 * Затухание у краёв прокручиваемой области — ТОЛЬКО когда за краем реально есть
 * скрытый контент: сверху при прокрутке вниз, снизу пока не достигли дна. В
 * дефолтной позиции и у самого дна затухания нет (иначе первая/последняя
 * карточка размывалась бы зря, а вместо затухания появлялся бы пустой отступ).
 *
 * Управляет CSS-переменными `--fade-top` / `--fade-bottom`, которые читает
 * mask-image в стилях элемента. Порог 1px гасит дрожание на субпиксельном
 * скролле. Возвращает `ref` (инициализирует переменные при монтировании) и
 * `onScroll` (обновляет их на прокрутке) — навесить на скролл-контейнер.
 *
 * Общий для списка договоров (WorkspaceSidebar) и тела инспектора документа.
 */
export function useScrollFade() {
  const update = useCallback((el: HTMLElement) => {
    const atTop = el.scrollTop <= 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    el.style.setProperty('--fade-top', atTop ? '0px' : '28px');
    el.style.setProperty('--fade-bottom', atBottom ? '0px' : '28px');
  }, []);

  const ref = useCallback((el: HTMLElement | null) => el && update(el), [update]);
  const onScroll = useCallback((e: UIEvent<HTMLElement>) => update(e.currentTarget), [update]);

  return { ref, onScroll };
}
