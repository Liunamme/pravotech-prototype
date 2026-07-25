import { DocumentInspector } from '@/core/documents/DocumentInspector';

/**
 * Точка монтирования инспектора документов (docs/UX.md §4). Слайд-овер сам
 * себя позиционирует фиксированно у правого края экрана (см.
 * `DocumentInspector.module.css`) и читает состояние из `uiSlice.inspector` —
 * `InspectorSlot` не занимает место в раскладке (в отличие от заглушки этапа
 * 3–6), он лишь называет место, где живёт этот кусок платформы, и должен
 * монтироваться внутри Router-контекста (нужен `useSearchParams`) — поэтому
 * страницы (`TodayPage`, `WorkspacePage`, `SettingsPage`), а не `AppShell`,
 * монтируют его у себя.
 */
export function InspectorSlot() {
  return <DocumentInspector />;
}
