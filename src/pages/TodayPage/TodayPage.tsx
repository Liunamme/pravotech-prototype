import { useEffect, useState } from 'react';
import { TODAY_SCOPE } from '@/types/domain';
import { InspectorSlot } from '@/core/layout/InspectorSlot';
import { QueueDrawer, QueueTrigger } from '@/core/layout/QueueDrawer';
import { MobileViewBar } from '@/core/layout/MobileChrome';
import { ChatView } from '@/core/chat/ChatView';
import { BackgroundTaskTray } from '@/core/tasks/BackgroundTaskTray';
import { useStore } from '@/store';
import { selectQueueCounts } from '@/store/selectors';
import { cn } from '@/shared/lib/cn';
import { useDeviceClass } from '@/shared/lib/useDeviceClass';
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
  /** Открытый документный оверлей полностью накрывает очередь — см. `.behindInspector` в CSS. */
  const inspectorOpen = useStore((state) => Boolean(state.inspector));
  /** Узел стеклянной плашки `main` — портал документного инспектора рендерится
      внутрь него (design_handoff: оверлей лежит НАД содержимым `main`, не окна). */
  const [mainEl, setMainEl] = useState<HTMLDivElement | null>(null);

  /**
   * На планшете три колонки не помещаются: очередь уезжает в выдвижную панель
   * поверх рабочей области, а её место забирает чат (docs/UX.md §8).
   */
  const device = useDeviceClass();
  const isTablet = device === 'tablet';
  const isMobile = device === 'mobile';
  const [queueOpen, setQueueOpen] = useState(false);
  const counts = useStore(selectQueueCounts);
  const queueCount = counts.P0 + counts.P1 + counts.P2 + counts.P3;


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

  const queueTrigger = (
    <QueueTrigger open={queueOpen} onToggle={() => setQueueOpen((open) => !open)} count={queueCount} />
  );

  if (isMobile) {
    return (
      <div className={styles.mobileRoot} ref={setMainEl}>
        {/* Вкладок на «Сегодня» нет: сроки живут внутри очереди (сегмент
            «Очередь · Сроки»), и единственная оставшаяся поверхность — диалог.
            Одна вкладка — это не выбор, а строка, отнятая у переписки. */}
        <MobileViewBar title="Сегодня" options={[]} value="chat" onValueChange={() => {}} action={queueTrigger} />

        <div className={styles.mobileBody}>
          {threadExists && (
            <ChatView threadId={TODAY_THREAD_ID} scope={TODAY_SCOPE} autoRunOnEmpty="дайджест" showHeader={false} />
          )}
        </div>

        <QueueDrawer asDrawer open={queueOpen} onOpenChange={setQueueOpen} container={mainEl}>
          <RightPanel />
        </QueueDrawer>

        <InspectorSlot container={mainEl} />
        <BackgroundTaskTray />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <DayNav />

      <div className={styles.main} ref={setMainEl}>
        <div className={styles.center}>
          {threadExists && (
            <ChatView
              threadId={TODAY_THREAD_ID}
              scope={TODAY_SCOPE}
              autoRunOnEmpty="дайджест"
              headerAction={isTablet ? queueTrigger : undefined}
            />
          )}
        </div>

        <QueueDrawer
          asDrawer={isTablet}
          open={queueOpen}
          onOpenChange={setQueueOpen}
          container={mainEl}
          columnClassName={cn(styles.right, inspectorOpen && styles.behindInspector)}
        >
          <RightPanel />
        </QueueDrawer>

        <InspectorSlot container={mainEl} />
      </div>

      <BackgroundTaskTray />
    </div>
  );
}
