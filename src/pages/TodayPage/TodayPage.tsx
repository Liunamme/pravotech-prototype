import { useEffect } from 'react';
import { TODAY_SCOPE } from '@/types/domain';
import { ResizablePanels } from '@/core/layout/ResizablePanels';
import { InspectorSlot } from '@/core/layout/InspectorSlot';
import { ChatView } from '@/core/chat/ChatView';
import { BackgroundTaskTray } from '@/core/tasks/BackgroundTaskTray';
import { useStore } from '@/store';
import { DayNav } from './DayNav';
import { RightPanel } from './RightPanel';
import styles from './TodayPage.module.css';

/** Канонический id дневного треда (docs/SCENARIOS.md §2, таблица «Треды»). */
const TODAY_THREAD_ID = 'thread-today';

/**
 * Уровень 1 — «Сегодня» (tech-task.md, docs/UX.md §1, §5): три колонки —
 * навигация дня, дневной чат, очередь/сроки со сквозной плашкой «Ближайшее».
 *
 * `InspectorSlot`/`BackgroundTaskTray` монтируются здесь (а не в `AppShell`,
 * вне границ этой задачи), потому что оба нужны внутри Router-контекста
 * (`useSearchParams`/`useNavigate`) — см. комментарий `InspectorSlot.tsx`.
 * Оба читают глобальное состояние стора, так что их можно смонтировать в
 * каждой странице независимо: рендерится в моменте только одна страница.
 */
export function TodayPage() {
  const threadExists = useStore((state) => Boolean(state.threads[TODAY_THREAD_ID]));
  const createThread = useStore((state) => state.createThread);

  // Тред «Сегодня» создаётся один раз при первом заходе на страницу в этой
  // сессии стора — если он уже есть (повторный заход, HMR), не трогаем его.
  useEffect(() => {
    if (threadExists) return;
    const now = new Date().toISOString();
    createThread({
      id: TODAY_THREAD_ID,
      workspaceId: TODAY_SCOPE,
      title: 'Сегодня',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      unread: false,
    });
  }, [threadExists, createThread]);

  return (
    <div className={styles.root}>
      <ResizablePanels
        storageKey="today"
        className={styles.panels}
        panels={[
          { id: 'left', defaultWidth: 240, minWidth: 200 },
          { id: 'center', flex: true },
          { id: 'right', defaultWidth: 360, minWidth: 300 },
        ]}
      >
        <DayNav />

        <div className={styles.center}>
          {threadExists && <ChatView threadId={TODAY_THREAD_ID} scope={TODAY_SCOPE} autoRunOnEmpty="дайджест" />}
        </div>

        <RightPanel />
      </ResizablePanels>

      <InspectorSlot />
      <BackgroundTaskTray />
    </div>
  );
}
