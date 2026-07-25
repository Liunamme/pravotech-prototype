import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessagesSquare, Plus } from 'lucide-react';
import type { Id, ThreadStatus } from '@/types/domain';
import type { WorkspaceManifest } from '@/workspaces/types';
import { useStore } from '@/store';
import { selectWorkspaceThreads } from '@/store/selectors';
import { Button, EmptyState, IconButton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import styles from './WorkspaceSidebar.module.css';

export type WorkspaceSidebarProps = {
  manifest: WorkspaceManifest;
  activeThreadId?: Id;
  activeTabId?: Id;
};

const STATUS_DOT: Record<ThreadStatus, string> = {
  active: 'active',
  awaiting_user: 'awaiting',
  working: 'working',
  done: 'done',
};

/**
 * Левая колонка уровня 2 (tech-task.md, docs/DOMAIN.md §8): список чатов-
 * задач пространства сверху + вкладки контекста снизу. Один и тот же
 * компонент для любого пространства — данные приходят из `manifest`, ничего
 * не хардкожено про конкретное пространство (SPEC §2, инвариант ядра).
 */
export function WorkspaceSidebar({ manifest, activeThreadId, activeTabId }: WorkspaceSidebarProps) {
  const threads = useStore((state) => selectWorkspaceThreads(state, manifest.id));
  const createThread = useStore((state) => state.createThread);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const firstTab = manifest.contextTabs[0];

  // Вкладка контекста — ЛОКАЛЬНОЕ состояние, не URL: переключение «Договоры/
  // Обязательства» не должно сбрасывать выбранный в центре чат-тред. URL хранит
  // только активный тред; вкладка контекста живёт здесь.
  const initialTab =
    activeTabId && manifest.contextTabs.some((t) => t.id === activeTabId) ? activeTabId : firstTab?.id;
  const [tabValue, setTabValue] = useState<Id | undefined>(initialTab);

  // Если пришли по прямой ссылке /tab/:tabId — синхронизируем локальную вкладку.
  useEffect(() => {
    if (activeTabId && manifest.contextTabs.some((t) => t.id === activeTabId)) {
      setTabValue(activeTabId);
    }
  }, [activeTabId, manifest.contextTabs]);

  function handleNewThread() {
    if (creating) return;
    setCreating(true);
    const id = `thread-${manifest.id}-${Date.now()}`;
    const now = new Date().toISOString();
    createThread({
      id,
      workspaceId: manifest.id,
      title: 'Новый разговор',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      unread: false,
    });
    navigate(`/w/${manifest.id}/t/${id}`);
    setCreating(false);
  }

  return (
    <div className={styles.root}>
      <div className={styles.threadsSection}>
        <div className={styles.threadsHeader}>
          <p className={styles.sectionLabel}>Диалоги</p>
          <IconButton
            aria-label="Новый диалог"
            variant="ghost"
            size="sm"
            className={styles.newThreadButton}
            onClick={handleNewThread}
          >
            <Plus size={13} strokeWidth={2} />
          </IconButton>
        </div>

        {threads.length === 0 ? (
          <EmptyState
            className={styles.threadsEmpty}
            icon={MessagesSquare}
            title="Пока ни одного диалога"
            description="Каждый диалог — отдельная задача. Начните с вопроса агенту."
            action={
              <Button variant="secondary" size="sm" onClick={handleNewThread}>
                Новый диалог
              </Button>
            }
          />
        ) : (
          <div className={styles.threadsList}>
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/w/${manifest.id}/t/${thread.id}`}
                className={cn(styles.threadItem, thread.id === activeThreadId && styles.threadActive)}
              >
                <span className={cn(styles.statusDot, styles[`status_${STATUS_DOT[thread.status]}`])} aria-hidden="true" />
                <span className={styles.threadTitle}>{thread.title}</span>
                {thread.unread && <span className={styles.unreadDot} aria-label="Есть непрочитанное" />}
              </Link>
            ))}
          </div>
        )}
      </div>

      {manifest.contextTabs.length > 0 && tabValue && (
        <Tabs value={tabValue} onValueChange={(value) => setTabValue(value)} className={styles.tabsRoot}>
          <TabsList className={styles.tabsList}>
            {manifest.contextTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={styles.tabTrigger}
                  icon={<Icon size={14} strokeWidth={2} />}
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {manifest.contextTabs.map((tab) => {
            const TabComponent = tab.Component;
            return (
              <TabsContent key={tab.id} value={tab.id} className={styles.tabContent}>
                <TabComponent workspaceId={manifest.id} />
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Аккаунт внизу колонки (design_handoff строки ~113-116) — статичная
          визуальная деталь, как и в самом макете: в проекте нет модели
          пользователя/аутентификации (вне границ этой задачи). */}
      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">
          ЭЗ
        </span>
        <span className={styles.accountBody}>
          <span className={styles.accountName}>Э. Задорожный</span>
          <span className={styles.accountRole}>Юрист</span>
        </span>
      </div>
    </div>
  );
}
