import { DocumentInspector } from '@/core/documents/DocumentInspector';

export type InspectorSlotProps = {
  /**
   * DOM-узел стеклянной плашки `main` (design_handoff: инспектор — оверлей
   * ВНУТРИ main, `position: absolute` относительно неё, не относительно
   * всего окна). Пока узел ещё не примонтирован (первый рендер страницы),
   * `undefined` — портал временно уходит в `document.body`, а как только
   * страница отдаёт реальный узел, инспектор перерисовывается уже внутри
   * него (см. `DocumentInspector.module.css`: там же — `position: absolute`).
   */
  container?: HTMLElement | null;
};

/**
 * Точка монтирования инспектора документов (docs/UX.md §4). Слайд-овер сам
 * себя позиционирует (см. `DocumentInspector.module.css`) и читает состояние
 * из `uiSlice.inspector` — `InspectorSlot` не занимает место в раскладке, он
 * лишь называет место, где живёт этот кусок платформы, и должен монтироваться
 * внутри Router-контекста (нужен `useSearchParams`) — поэтому страницы
 * (`TodayPage`, `WorkspacePage`, `SettingsPage`), а не `AppShell`, монтируют
 * его у себя.
 */
export function InspectorSlot({ container }: InspectorSlotProps) {
  return <DocumentInspector container={container} />;
}
