import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

/**
 * Соединяет клик по событию календаря (`relatedCardId`, docs/UX.md §5) с
 * очередью карточек: `DeadlineTimeline` только кладёт `focusedCardId` в
 * `uiSlice` (её собственная граница — `core/calendar/**`, она не знает, где
 * физически рендерится очередь). `CardQueue` — граница «только чтение» этого
 * этапа, поэтому связь замыкается здесь, на уровне страницы: раз в сторе
 * появился `focusedCardId`, найти в DOM карточку с этим `data-card-id`
 * (`ActionCardShell` уже проставляет атрибут) и вызвать нативный `.focus()` —
 * тот же `onFocus`, что уже умеет `ActionCardShell` (раскрывает карточку),
 * срабатывает и здесь, без необходимости лезть внутрь чужого компонента.
 */
export function useFocusCardIntoView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const focusedCardId = useStore((state) => state.focusedCardId);
  const focusCard = useStore((state) => state.focusCard);

  useEffect(() => {
    if (!focusedCardId) return;

    const node = ref.current?.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(focusedCardId)}"]`);
    if (node) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }

    // Разовый импульс: сбрасываем сразу же, иначе повторный клик на тот же
    // срок (то же значение `focusedCardId`) не породит нового эффекта.
    const timer = window.setTimeout(() => focusCard(null), 50);
    return () => window.clearTimeout(timer);
  }, [focusedCardId, focusCard]);

  return ref;
}
