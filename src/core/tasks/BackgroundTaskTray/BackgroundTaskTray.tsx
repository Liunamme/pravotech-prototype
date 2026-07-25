import { Check, ListTodo, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import type { BackgroundTask, TaskStep } from '@/types/domain';
import { Badge, Button, IconButton, Popover, PopoverContent, PopoverTrigger } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useBackgroundTask } from '../useBackgroundTask';
import styles from './BackgroundTaskTray.module.css';

/**
 * Лоток фоновых задач (docs/DOMAIN.md §6, docs/UX.md §8). Долгие операции
 * (>3с — casePosition) уходят сюда через `handoff`; юрист свободен и может
 * заниматься другим, задача продолжается независимо от текущей страницы.
 *
 * Решение «рейка vs панель» (7.3 задания этапа): компактный индикатор,
 * визуально закреплённый у нижнего края рейки, по клику — поповер со
 * списком. `Rail.tsx` — вне границ этой задачи (готов на этапе 1/3), поэтому
 * индикатор не встроен В рейку буквально, а зафиксирован координатами сразу
 * правее неё (`left: calc(var(--rail-width) + ...)`, см. модуль стилей) —
 * читается как её продолжение, не требуя правки чужого компонента и не
 * рискуя наложиться на её собственные иконки темы/настроек в нижней части.
 * Полноэкранная панель снизу (альтернатива из задания) отклонена: она
 * забрала бы куда больше внимания ради задачи, которая по определению не
 * требует немедленного участия юриста («юрист свободен»).
 */
export function BackgroundTaskTray() {
  const { tasks, activeCount, openResult, dismissTask } = useBackgroundTask();

  const triggerLabel =
    activeCount > 0 ? `Фоновые задачи, активных: ${activeCount}` : 'Фоновые задачи';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={styles.trigger} aria-label={triggerLabel}>
          <ListTodo size={18} strokeWidth={1.75} aria-hidden="true" />
          {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className={styles.panel}>
        <p className={styles.panelTitle}>Фоновые задачи</p>

        {tasks.length === 0 ? (
          <p className={styles.empty}>Здесь появятся долгие операции агента.</p>
        ) : (
          <ul className={styles.list}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onOpen={openResult} onDismiss={dismissTask} />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
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
