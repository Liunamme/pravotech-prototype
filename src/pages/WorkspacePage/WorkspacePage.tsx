import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { MessageCircleQuestion, Sparkles } from 'lucide-react';
import type { AgentSkill } from '@/workspaces/types';
import type { Id } from '@/types/domain';
import { getWorkspace } from '@/workspaces/registry';
import { useStore } from '@/store';
import { cn } from '@/shared/lib/cn';
import { InspectorSlot } from '@/core/layout/InspectorSlot';
import { ChatView } from '@/core/chat/ChatView';
import { BackgroundTaskTray } from '@/core/tasks/BackgroundTaskTray';
import { EmptyState } from '@/shared/ui';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceRightPanel } from './WorkspaceRightPanel';
import styles from './WorkspacePage.module.css';

type PendingAutoRun = { threadId: Id; prompt: string };

/**
 * Уровень 2 — рабочее пространство (tech-task.md, вторая ASCII-раскладка):
 * та же грамматика, что и «Сегодня» (диалог в центре, карточки справа), но
 * левая колонка теперь про пространство — чаты-задачи и вкладки контекста
 * вместо навигации дня. Один и тот же компонент для любого пространства —
 * все данные берутся из `manifest` (`getWorkspace`, единственный разрешённый
 * способ ядру знать о пространствах, docs/DOMAIN.md §8), ничего не
 * захардкожено про конкретные пространства из реестра.
 */
export function WorkspacePage() {
  const { workspaceId, threadId, tabId } = useParams<{ workspaceId: string; threadId?: string; tabId?: string }>();
  const manifest = workspaceId ? getWorkspace(workspaceId) : undefined;
  const thread = useStore((state) => (threadId ? state.threads[threadId] : undefined));
  const createThread = useStore((state) => state.createThread);
  /** Открытый документный оверлей полностью накрывает правую колонку — см. `.behindInspector` в CSS. */
  const inspectorOpen = useStore((state) => Boolean(state.inspector));
  const navigate = useNavigate();

  /**
   * Тред-приглашение «О чём поговорим?» заводит новый тред и хочет сразу
   * прогнать выбранную подсказку через агента (`ChatView.autoRunOnEmpty`).
   * Живёт здесь, а не в дочернем компоненте: как только `navigate()` меняет
   * `:threadId` в URL, эта же страница переключает центр на обычный
   * `<ChatView>` для нового треда — состояние обязано пережить этот
   * переключатель ветки рендера, иначе автозапуск потеряется.
   */
  const [pendingAutoRun, setPendingAutoRun] = useState<PendingAutoRun | null>(null);
  /** Узел стеклянной плашки `main` — портал документного инспектора рендерится
      внутрь него (design_handoff: оверлей лежит НАД содержимым `main`, не окна). */
  const [mainEl, setMainEl] = useState<HTMLDivElement | null>(null);

  if (!workspaceId) return <Navigate to="/today" replace />;

  if (!manifest) {
    return (
      <div className={styles.notFound}>
        <EmptyState
          icon={MessageCircleQuestion}
          title="Пространство не найдено"
          description={`Нет рабочего пространства с идентификатором «${workspaceId}».`}
        />
      </div>
    );
  }

  const validThread = thread && thread.workspaceId === manifest.id ? thread : undefined;

  function handlePickSkill(skill: AgentSkill) {
    const id = `thread-${manifest!.id}-${Date.now()}`;
    const now = new Date().toISOString();
    createThread({
      id,
      workspaceId: manifest!.id,
      title: skill.label,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      unread: false,
    });
    setPendingAutoRun({ threadId: id, prompt: skill.prompt });
    navigate(`/w/${manifest!.id}/t/${id}`);
  }

  return (
    <div className={styles.root}>
      <WorkspaceSidebar manifest={manifest} activeThreadId={validThread?.id} activeTabId={tabId} />

      <div className={styles.main} ref={setMainEl}>
        <div className={styles.center}>
          {validThread ? (
            <ChatView
              threadId={validThread.id}
              scope={manifest.id}
              autoRunOnEmpty={pendingAutoRun?.threadId === validThread.id ? pendingAutoRun.prompt : undefined}
            />
          ) : (
            <WorkspaceInvite skills={manifest.skills} onPickSkill={handlePickSkill} />
          )}
        </div>

        <div className={cn(styles.right, inspectorOpen && styles.behindInspector)}>
          <WorkspaceRightPanel workspaceId={manifest.id} />
        </div>

        <InspectorSlot container={mainEl} />
      </div>

      <BackgroundTaskTray />
    </div>
  );
}

/**
 * Центр без выбранного треда (7.5 задания): пустое состояние с подсказками
 * навыков пространства. Текст — «Пустой тред» из docs/UX.md §6 (дословно):
 * ближайшее по смыслу состояние из таблицы, явно завязанное на чипы навыков.
 */
function WorkspaceInvite({
  skills,
  onPickSkill,
}: {
  skills: AgentSkill[];
  onPickSkill: (skill: AgentSkill) => void;
}) {
  return (
    <div className={styles.invite}>
      <EmptyState
        icon={MessageCircleQuestion}
        title="О чём поговорим?"
        description="Спросите что угодно о делах и договорах — или начните с подсказки."
      />
      {skills.length > 0 && (
        <div className={styles.skillChips} role="list" aria-label="Подсказки навыков">
          {skills.map((skill) => {
            const Icon = skill.icon ?? Sparkles;
            return (
              <button
                key={skill.id}
                type="button"
                role="listitem"
                className={styles.skillChip}
                onClick={() => onPickSkill(skill)}
              >
                <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                {skill.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
