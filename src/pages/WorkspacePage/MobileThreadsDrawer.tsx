import * as RadixDialog from '@radix-ui/react-dialog';
import { MessagesSquare, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Id, Thread, ThreadStatus } from '@/types/domain';
import { useStore } from '@/store';
import { selectWorkspaceThreads } from '@/store/selectors';
import { NEW_THREAD_TITLE } from '@/shared/lib/threadTitle';
import { newId } from '@/shared/lib/id';
import { cn } from '@/shared/lib/cn';
import { Button, IconButton } from '@/shared/ui';
import styles from './MobileThreadsDrawer.module.css';

const STATUS_CLASS: Record<ThreadStatus, string> = {
  active: styles.statusActive!,
  awaiting_user: styles.statusAwaiting!,
  working: styles.statusWorking!,
  done: styles.statusDone!,
};

export type MobileThreadsDrawerProps = {
  workspaceId: Id;
  activeThreadId?: Id;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
};

/**
 * Список диалогов пространства на телефоне.
 *
 * На десктопе он всегда виден в сайдбаре, на телефоне колонок нет — поэтому
 * уезжает в панель по кнопке в верхней полосе (макет
 * `pravotex-adaptive.dc.html`, `convOpen`). Выезжает СЛЕВА, в отличие от
 * очереди: там, где на десктопе стоял сайдбар, — направление подсказывает,
 * что это, ещё до того как панель доехала.
 *
 * Устроена как `QueueDrawer` и по тем же причинам: `modal={false}` вместо
 * модалки, стекло отдельным инертным слоем (`backdrop-filter` делает элемент
 * backdrop root, и прокрутка проваливалась бы сквозь панель).
 *
 * Выбор диалога закрывает панель сам: держать её открытой поверх только что
 * выбранной переписки незачем.
 */
export function MobileThreadsDrawer({
  workspaceId,
  activeThreadId,
  open,
  onOpenChange,
  container,
}: MobileThreadsDrawerProps) {
  const threads = useStore((state) => selectWorkspaceThreads(state, workspaceId));
  const createThread = useStore((state) => state.createThread);
  const navigate = useNavigate();

  function goTo(thread: Thread) {
    onOpenChange(false);
    navigate(`/w/${workspaceId}/t/${thread.id}`);
  }

  function handleNewThread() {
    const id = newId('thread');
    const now = new Date().toISOString();
    createThread({
      id,
      workspaceId,
      title: NEW_THREAD_TITLE,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      unread: false,
    });
    onOpenChange(false);
    navigate(`/w/${workspaceId}/t/${id}`);
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Content
          className={styles.content}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className={styles.glass} aria-hidden="true" />

          <div className={styles.header}>
            <RadixDialog.Title className={styles.heading}>Диалоги</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton className={styles.close} variant="ghost" size="sm" aria-label="Закрыть список диалогов">
                <X size={15} strokeWidth={2} />
              </IconButton>
            </RadixDialog.Close>
          </div>

          <div className={styles.list}>
            {threads.length === 0 ? (
              <p className={styles.empty}>Здесь пока пусто. Начните разговор — он появится в списке.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={cn(styles.item, thread.id === activeThreadId && styles.itemActive)}
                  aria-current={thread.id === activeThreadId ? 'page' : undefined}
                  onClick={() => goTo(thread)}
                >
                  <span className={cn(styles.status, STATUS_CLASS[thread.status])} aria-hidden="true" />
                  <span className={styles.title}>{thread.title}</span>
                </button>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <Button
              variant="secondary"
              size="sm"
              className={styles.newThread}
              iconLeft={<Plus size={14} strokeWidth={2} aria-hidden="true" />}
              onClick={handleNewThread}
            >
              Новый диалог
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Кнопка открытия списка — живёт в верхней полосе экрана. */
export function MobileThreadsTrigger({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={styles.trigger} onClick={onToggle} aria-expanded={open} aria-label="Диалоги">
      <MessagesSquare size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
