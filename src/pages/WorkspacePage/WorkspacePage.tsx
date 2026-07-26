import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { MessageCircleQuestion, Sparkles } from 'lucide-react';
import type { AgentSkill } from '@/workspaces/types';
import type { Id } from '@/types/domain';
import { getWorkspace } from '@/workspaces/registry';
import { useStore } from '@/store';
import { selectWorkspaceQueue } from '@/store/selectors';
import { cn } from '@/shared/lib/cn';
import { NEW_THREAD_TITLE } from '@/shared/lib/threadTitle';
import { InspectorSlot } from '@/core/layout/InspectorSlot';
import { QueueDrawer, QueueTrigger } from '@/core/layout/QueueDrawer';
import { MobileViewBar } from '@/core/layout/MobileChrome';
import { DeadlineTimeline } from '@/core/calendar/DeadlineTimeline';
import { MobileThreadsDrawer, MobileThreadsTrigger } from './MobileThreadsDrawer';
import { ChatView } from '@/core/chat/ChatView';
import { Composer } from '@/core/chat/Composer';
import { BackgroundTaskTray } from '@/core/tasks/BackgroundTaskTray';
import { Button, EmptyState } from '@/shared/ui';
import { newId } from '@/shared/lib/id';
import { useDeviceClass } from '@/shared/lib/useDeviceClass';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceRightPanel } from './WorkspaceRightPanel';
import styles from './WorkspacePage.module.css';

/**
 * Ввод, который ждёт нового треда. `mode` различает, чей это текст:
 *  • `trigger` — чип навыка: прогон идёт молча, реплики юриста в переписке нет;
 *  • `send` — юрист написал сам в поле на приглашении: текст обязан появиться
 *    в переписке как его сообщение (и дать треду тему).
 */
type PendingAutoRun = { threadId: Id; prompt: string; mode: 'trigger' | 'send' };

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

  /**
   * На планшете три колонки не помещаются: очередь уезжает в выдвижную панель
   * поверх рабочей области, а её место забирает чат (docs/UX.md §8).
   */
  const device = useDeviceClass();
  const isTablet = device === 'tablet';
  const isMobile = device === 'mobile';
  const [queueOpen, setQueueOpen] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);
  /**
   * Что показывает единственная колонка на телефоне: переписка, одна из
   * вкладок контекста пространства или сроки. Очередь сюда не входит —
   * она открывается поверх (см. `TodayPage`).
   */
  const [mobileView, setMobileView] = useState<string>('chat');
  const queueCount = useStore((state) => (workspaceId ? selectWorkspaceQueue(state, workspaceId).length : 0));

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
  /**
   * В ссылке есть тред, но его нет в этом пространстве: либо диалог удалён,
   * либо адрес скопирован из чужого пространства
   * (`/w/obligations/t/thread-lit-…`). Раньше такая ссылка молча показывала
   * приглашение «О чём поговорим?» — юрист не понимал, что попал не туда, и
   * заводил новый разговор вместо исходного.
   */
  const threadMissing = Boolean(threadId) && !validThread;
  /**
   * То же про вкладку контекста: неизвестный `tabId` подменялся первой
   * вкладкой, а адрес продолжал утверждать, что открыта другая. Ссылку
   * чиним на месте — показывать ради этого 404 не за что, содержимое
   * страницы от вкладки не зависит.
   */
  const tabMissing = Boolean(tabId) && !manifest.contextTabs.some((tab) => tab.id === tabId);
  if (tabMissing) return <Navigate to={`/w/${manifest.id}`} replace />;

  function handlePickSkill(skill: AgentSkill) {
    const id = newId('thread');
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
    setPendingAutoRun({ threadId: id, prompt: skill.prompt, mode: 'trigger' });
    navigate(`/w/${manifest!.id}/t/${id}`);
  }

  /**
   * Отправка из поля ввода на приглашении: заводим тред ровно как кнопка «+»
   * в сайдбаре — с безымянным заголовком, который `useAgentStream` заменит
   * темой из этой же реплики, — и уходим в него. Тред сразу появляется в
   * списке диалогов, а текст улетает агенту как обычное сообщение.
   */
  function handleInviteSend(text: string) {
    const id = newId('thread');
    const now = new Date().toISOString();
    createThread({
      id,
      workspaceId: manifest!.id,
      title: NEW_THREAD_TITLE,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      unread: false,
    });
    setPendingAutoRun({ threadId: id, prompt: text, mode: 'send' });
    navigate(`/w/${manifest!.id}/t/${id}`);
  }

  const queueTrigger = (
    <QueueTrigger open={queueOpen} onToggle={() => setQueueOpen((open) => !open)} count={queueCount} />
  );

  if (isMobile) {
    const activeTab = manifest.contextTabs.find((tab) => tab.id === mobileView);
    const TabComponent = activeTab?.Component;

    return (
      <div className={styles.mobileRoot} ref={setMainEl}>
        <MobileViewBar
          title={manifest.shortTitle}
          leading={<MobileThreadsTrigger open={threadsOpen} onToggle={() => setThreadsOpen((open) => !open)} />}
          options={[
            { value: 'chat', label: 'Диалог' },
            ...manifest.contextTabs.map((tab) => ({ value: tab.id, label: tab.label })),
            { value: 'dates', label: 'Сроки' },
          ]}
          value={mobileView}
          onValueChange={setMobileView}
          action={queueTrigger}
        />

        <div className={styles.mobileBody}>
          {mobileView === 'chat' ? (
            validThread ? (
              <ChatView
                threadId={validThread.id}
                scope={manifest.id}
                showHeader={false}
                autoRunOnEmpty={
                  pendingAutoRun?.threadId === validThread.id && pendingAutoRun.mode === 'trigger'
                    ? pendingAutoRun.prompt
                    : undefined
                }
                autoSendOnEmpty={
                  pendingAutoRun?.threadId === validThread.id && pendingAutoRun.mode === 'send'
                    ? pendingAutoRun.prompt
                    : undefined
                }
              />
            ) : (
              <WorkspaceInvite skills={manifest.skills} onPickSkill={handlePickSkill} onSend={handleInviteSend} />
            )
          ) : TabComponent ? (
            <div className={styles.mobileTab}>
              <TabComponent workspaceId={manifest.id} />
            </div>
          ) : (
            <div className={styles.mobileTab}>
              <DeadlineTimeline scope={manifest.id} />
            </div>
          )}
        </div>

        <MobileThreadsDrawer
          workspaceId={manifest.id}
          activeThreadId={validThread?.id}
          open={threadsOpen}
          onOpenChange={setThreadsOpen}
          container={mainEl}
        />

        <QueueDrawer asDrawer open={queueOpen} onOpenChange={setQueueOpen} container={mainEl}>
          <WorkspaceRightPanel workspaceId={manifest.id} />
        </QueueDrawer>

        <InspectorSlot container={mainEl} />
        <BackgroundTaskTray />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <WorkspaceSidebar manifest={manifest} activeThreadId={validThread?.id} activeTabId={tabId} />

      <div className={styles.main} ref={setMainEl}>
        <div className={styles.center}>
          {threadMissing ? (
            <div className={styles.notFound}>
              <EmptyState
                icon={MessageCircleQuestion}
                title="Диалог не найден"
                description={`В пространстве «${manifest.title}» нет такого разговора. Возможно, ссылка ведёт в другое пространство или диалог удалён.`}
                action={
                  <Button variant="secondary" onClick={() => navigate(`/w/${manifest.id}`, { replace: true })}>
                    К списку диалогов
                  </Button>
                }
              />
            </div>
          ) : validThread ? (
            <ChatView
              threadId={validThread.id}
              scope={manifest.id}
              autoRunOnEmpty={
                pendingAutoRun?.threadId === validThread.id && pendingAutoRun.mode === 'trigger'
                  ? pendingAutoRun.prompt
                  : undefined
              }
              autoSendOnEmpty={
                pendingAutoRun?.threadId === validThread.id && pendingAutoRun.mode === 'send'
                  ? pendingAutoRun.prompt
                  : undefined
              }
              headerAction={isTablet ? queueTrigger : undefined}
            />
          ) : (
            <WorkspaceInvite
              skills={manifest.skills}
              onPickSkill={handlePickSkill}
              onSend={handleInviteSend}
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
          <WorkspaceRightPanel workspaceId={manifest.id} />
        </QueueDrawer>

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
  onSend,
  headerAction,
}: {
  skills: AgentSkill[];
  onPickSkill: (skill: AgentSkill) => void;
  onSend: (text: string) => void;
  /** Кнопка «Очередь» на планшете: своей шапки у приглашения нет, поэтому — в угол. */
  headerAction?: ReactNode;
}) {
  return (
    <div className={styles.invite}>
      {headerAction && <div className={styles.inviteHeaderAction}>{headerAction}</div>}
      <div className={styles.inviteBody}>
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

      {/* Тот же композер, что и в треде: приглашение — это будущий диалог,
          писать в него нужно так же, как в любой другой. */}
      <Composer isStreaming={false} onSend={onSend} onStop={() => {}} />
    </div>
  );
}
