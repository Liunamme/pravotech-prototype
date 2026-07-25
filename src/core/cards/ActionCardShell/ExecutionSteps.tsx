import { Check, CircleCheckBig, LoaderCircle, RotateCcw, TriangleAlert } from 'lucide-react';
import type { TaskStep } from '@/types/domain';
import { Button } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import type { ExecutionSnapshot } from '../useCardDecision';
import styles from './ExecutionSteps.module.css';

export type ExecutionStepsProps = {
  execution: ExecutionSnapshot;
  onRetry: () => void;
};

/**
 * Тело карточки в `executing`/`done`/`failed` (docs/UX.md §2, §5.8 задания).
 * Никогда не показывает голый спиннер: у каждого шага есть подпись, а
 * неопределённый прогресс (без `progress` от `execute()`) — всё равно
 * подписан текстом текущего шага, не только крутящейся иконкой.
 */
export function ExecutionSteps({ execution, onRetry }: ExecutionStepsProps) {
  const { phase, steps, progress, message, doneAt } = execution;

  if (phase === 'done') {
    return (
      <div className={styles.doneRow} role="status">
        <CircleCheckBig size={16} strokeWidth={2} className={styles.doneIcon} aria-hidden="true" />
        <span>Выполнено{doneAt ? ` · ${formatDateTime(doneAt)}` : ''}</span>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {steps.length > 0 && (
        <ul className={styles.steps} aria-label="Ход исполнения">
          {steps.map((step, index) => (
            <StepRow key={`${index}-${step.label}`} step={step} />
          ))}
        </ul>
      )}

      {phase === 'executing' && (
        <div className={styles.status} role="status" aria-live="polite">
          {progress ? (
            <div className={styles.progress}>
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{ width: `${Math.min(100, Math.round((progress.done / Math.max(1, progress.total)) * 100))}%` }}
                />
              </div>
              <span className={styles.count}>
                {progress.done} из {progress.total}
              </span>
            </div>
          ) : (
            steps.length === 0 && (
              <span className={styles.indeterminateLabel}>
                <LoaderCircle size={14} strokeWidth={2} className={styles.spin} aria-hidden="true" />
                Выполняется…
              </span>
            )
          )}
        </div>
      )}

      {phase === 'failed' && (
        <div className={styles.failedRow} role="alert">
          <TriangleAlert size={16} strokeWidth={2} className={styles.failedIcon} aria-hidden="true" />
          <span className={styles.failedMessage}>{message ?? 'Не удалось выполнить действие.'}</span>
          <Button variant="secondary" size="sm" iconLeft={<RotateCcw size={14} strokeWidth={2} />} onClick={onRetry}>
            Повторить
          </Button>
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: TaskStep }) {
  return (
    <li className={cn(styles.step, styles[`step_${step.state}`])}>
      <span className={styles.stepIcon} aria-hidden="true">
        {step.state === 'done' && <Check size={13} strokeWidth={2.5} />}
        {step.state === 'active' && <LoaderCircle size={13} strokeWidth={2.5} className={styles.spin} />}
        {step.state === 'failed' && <TriangleAlert size={13} strokeWidth={2.5} />}
        {step.state === 'pending' && <span className={styles.stepDot} />}
      </span>
      <span className={styles.stepLabel}>{step.label}</span>
    </li>
  );
}
