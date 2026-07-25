/**
 * Наблюдатель за фоновыми задачами (docs/DOMAIN.md §6, docs/SCENARIOS.md
 * §3.3). Держит стек тостов в курсе переходов `running → succeeded/failed`
 * и даёт `BackgroundTaskTray` навигацию «к результату».
 *
 * `seenStates` — намеренно МОДУЛЬНАЯ переменная, а не `useRef` внутри хука:
 * `BackgroundTaskTray` монтируется заново на каждой странице (`TodayPage`/
 * `WorkspacePage`/`SettingsPage` — см. их комментарии), а фоновая задача
 * (~18с, `casePosition`) вполне переживает переход между страницами. Если
 * бы «какие переходы уже показаны тостом» жило в `useRef` конкретного
 * монтирования, переход именно в момент навигации мог бы остаться
 * незамеченным — старый экземпляр хука уже размонтирован, новый ещё не
 * видел прежнего состояния. Модульная переменная переживает размонтирование
 * компонента, пока жив сам JS-модуль (весь срок жизни SPA-вкладки).
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BackgroundTask, Id, TaskState } from '@/types/domain';
import { TODAY_SCOPE } from '@/types/domain';
import { useStore } from '@/store';
import { selectActiveTasks } from '@/store/selectors';
import { useToast } from '@/shared/ui';

const seenStates: Record<Id, TaskState> = {};

export function useBackgroundTask() {
  const tasks = useStore((state) => state.tasks);
  const activeTasks = useStore(selectActiveTasks);
  const threads = useStore((state) => state.threads);
  const cards = useStore((state) => state.cards);
  const openInspector = useStore((state) => state.openInspector);
  const dismissTask = useStore((state) => state.dismissTask);
  const { toast } = useToast();
  const navigate = useNavigate();

  const openResult = useCallback(
    (task: BackgroundTask) => {
      const ref = task.resultRef;
      if (!ref) return;

      if (ref.kind === 'thread') {
        const thread = threads[ref.id];
        if (!thread) return;
        navigate(thread.workspaceId === TODAY_SCOPE ? '/today' : `/w/${thread.workspaceId}/t/${thread.id}`);
        return;
      }
      if (ref.kind === 'document') {
        openInspector(ref.id);
        return;
      }
      const card = cards[ref.id];
      if (card) navigate(`/w/${card.workspaceId}`);
    },
    [threads, cards, navigate, openInspector],
  );

  // Тост со ссылкой на результат по завершении (docs/SCENARIOS.md §3.3:
  // «по завершении — тост «Позиция готова» со ссылкой на тред»).
  useEffect(() => {
    for (const task of Object.values(tasks)) {
      const prev = seenStates[task.id];
      seenStates[task.id] = task.state;
      if (prev === undefined || prev === task.state) continue;

      if (task.state === 'succeeded') {
        toast({
          title: `Готово: ${task.title}`,
          description: 'Задача завершена в фоне.',
          variant: 'success',
          duration: 6000,
          action: task.resultRef ? { label: 'Открыть', onClick: () => openResult(task) } : undefined,
        });
      } else if (task.state === 'failed') {
        toast({
          title: `Не удалось: ${task.title}`,
          description: task.error ?? 'Задача завершилась с ошибкой.',
          variant: 'danger',
          duration: 6000,
        });
      }
    }
  }, [tasks, toast, openResult]);

  return {
    tasks: Object.values(tasks).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)),
    activeCount: activeTasks.length,
    openResult,
    dismissTask,
  };
}
