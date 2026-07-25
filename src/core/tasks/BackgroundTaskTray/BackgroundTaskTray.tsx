import { useEffect } from 'react';
import { Check, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import type { BackgroundTask, TaskStep } from '@/types/domain';
import { Badge, Button, IconButton } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useStore } from '@/store';
import { useBackgroundTask } from '../useBackgroundTask';
import styles from './BackgroundTaskTray.module.css';

/**
 * Лоток фоновых задач (docs/DOMAIN.md §6, docs/UX.md §8). Долгие операции
 * (>3с — casePosition) уходят сюда через `handoff`; юрист свободен, задача
 * продолжается независимо от страницы.
 *
 * Открывается кнопкой-колёсиком в рейке (`Rail` → `toggleTray` в `uiSlice`),
 * а не собственным триггером — так у него один источник открытия, без
 * дубликата у аккаунта. Плашка — стеклянный оверлей у нижнего края рейки
 * (design_handoff: `left:60px;bottom:16px`), закрывается ✕, `Esc` и кликом вне.
 */
export function BackgroundTaskTray() {
  const { tasks, openResult, dismissTask } = useBackgroundTask();
  const trayOpen = useStore((state) => state.trayOpen);
  const closeTray = useStore((state) => state.closeTray);

  useEffect(() => {
    if (!trayOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeTray();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [trayOpen, closeTray]);

  if (!trayOpen) return null;

  return (
    <>
      <div className={styles.scrim} onClick={closeTray} aria-hidden="true" />
      <div className={styles.panel} role="dialog" aria-label="Фоновые задачи">
        <div className={styles.panelHeader}>
          <p className={styles.panelTitle}>Фоновые задачи</p>
          <IconButton aria-label="Закрыть лоток задач" variant="ghost" size="sm" onClick={closeTray}>
            <X size={13} strokeWidth={2} />
          </IconButton>
        </div>

        {tasks.length === 0 ? (
          <p className={styles.empty}>Здесь появятся долгие операции агента.</p>
        ) : (
          <ul className={styles.list}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onOpen={openResult} onDismiss={dismissTask} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function TaskItem({
  task,
  onOpen,
  onDismiss,
}: {
  task: BackgroundTask;
  onOpen: (task: BackgroundTask) => void;
  onDismiss: (id: string) => void;
}) {
  const activeStep = task.steps.find((step) => step.state === 'active');
  const currentLabel = activeStep?.label ?? task.steps[task.steps.length - 1]?.label;
  const percent =
    task.progress && task.progress.total > 0
      ? Math.min(100, Math.round((task.progress.done / task.progress.total) * 100))
      : null;
  const isBusy = task.state === 'queued' || task.state === 'running';

  return (
    <li className={styles.item}>
      <div className={styles.itemHeader}>
        <span className={styles.itemTitle}>{task.title}</span>
        <IconButton
          aria-label={`Скрыть задачу «${task.title}»`}
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(task.id)}
        >
          <X size={13} strokeWidth={2} />
        </IconButton>
      </div>

      {task.steps.length > 0 && (
        <ol className={styles.steps} aria-label="Шаги задачи">
          {task.steps.map((step, index) => (
            <StepDot key={`${index}-${step.label}`} step={step} done={task.state === 'succeeded'} />
          ))}
        </ol>
      )}

      {isBusy && (
        <div className={styles.statusRow} role="status" aria-live="polite">
          {currentLabel && <span className={styles.statusLabel}>{currentLabel}</span>}
          {task.progress && (
            <span className={styles.progressWrap}>
              <span className={styles.track}>
                <span className={styles.fill} style={{ width: `${percent}%` }} />
              </span>
              <span className={styles.count}>
                {task.progress.done} из {task.progress.total}
              </span>
            </span>
          )}
        </div>
      )}

      {task.state === 'succeeded' && (
        <div className={styles.doneRow}>
          <Badge variant="success" size="sm">
            Готово
          </Badge>
          {task.resultRef && (
            <Button variant="secondary" size="sm" onClick={() => onOpen(task)}>
              Открыть результат
            </Button>
          )}
        </div>
      )}

      {task.state === 'failed' && (
        <div className={styles.failedRow} role="alert">
          <TriangleAlert size={14} strokeWidth={2} className={styles.failedIcon} aria-hidden="true" />
          <span className={styles.failedMessage}>{task.error ?? 'Не удалось выполнить задачу.'}</span>
        </div>
      )}

      {task.state === 'cancelled' && (
        <Badge variant="neutral" size="sm">
          Отменено
        </Badge>
      )}
    </li>
  );
}

function StepDot({ step, done }: { step: TaskStep; done: boolean }) {
  const effectiveState = done && step.state !== 'failed' ? 'done' : step.state;
  return (
    <li className={cn(styles.step, styles[`step_${effectiveState}`])} title={step.label}>
      <span className={styles.stepIcon} aria-hidden="true">
        {effectiveState === 'done' && <Check size={11} strokeWidth={2.5} />}
        {effectiveState === 'active' && <LoaderCircle size={11} strokeWidth={2.5} className={styles.spin} />}
        {effectiveState === 'failed' && <TriangleAlert size={11} strokeWidth={2.5} />}
        {effectiveState === 'pending' && <span className={styles.stepDotInner} />}
      </span>
    </li>
  );
}
