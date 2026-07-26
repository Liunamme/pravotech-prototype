/**
 * Логика решения по одной карточке (docs/UX.md §2 «Три исхода», «Undo»,
 * «Состояния исполнения»). `ActionCardShell` рисует, этот хук решает —
 * разделение по тому же принципу, что и `useAgentStream` для чата.
 *
 * Инварианты, которые отсюда важно понимать вызывающему коду
 * (`ActionCardShell`, `CardQueue`):
 *
 * 1. `cardsSlice.decide()` переводит карточку из `pending` сразу в
 *    терминальное состояние решения (`accepted`/`modified`/`rejected`) —
 *    поэтому она в тот же момент пропадает из `selectTodayQueue` /
 *    `selectWorkspaceQueue` (обе фильтруют только `pending`). Чтобы карточка
 *    успела показать `executing` → `done`/`failed` и уехать анимацией, а не
 *    исчезнуть мгновенно, `CardQueue` держит decided-карточки в отдельном
 *    локальном оверлее до тех пор, пока этот хук не скажет `onSettled`.
 * 2. `destructive: true` — вместо undo-тоста показывается `Dialog` (см.
 *    `ActionCardShell`), и уже подтверждённое решение выполняется без тоста
 *    (`skipToast`): диалог — это и есть явное подтверждение, второй раз
 *    спрашивать нечего.
 * 3. Отмена (`undoDecision`) не умеет «остановить» уже запущенный
 *    `execute()` — это мок без токена отмены. Вместо этого `cancelledRef`
 *    гасит применение уже пришедших/будущих событий потока к UI: для
 *    прототипа это неотличимо от настоящей отмены.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActionCard, CardDecision, Id, TaskEvent, TaskStep } from '@/types/domain';
import type { CardTypeDef, FieldErrors } from '@/workspaces/types';
import { useStore } from '@/store';
import { useToast } from '@/shared/ui';
import { diffPayload } from './diffPayload';
import { hasErrors, validateCardDecision } from './validation';

const NO_ERRORS: FieldErrors = {};

export type ExecutionPhase = 'idle' | 'executing' | 'done' | 'failed';

export type ExecutionSnapshot = {
  phase: ExecutionPhase;
  steps: TaskStep[];
  progress?: { done: number; total: number };
  message?: string;
  doneAt?: string;
};

const IDLE_EXECUTION: ExecutionSnapshot = { phase: 'idle', steps: [] };

/** Сколько карточка остаётся видимой в `done`-состоянии перед тем, как уехать (docs/UX.md §2). */
const DONE_LINGER_MS = 2000;
/** «Карточка решена» — сжатие по высоте + затухание, 220мс ease-in (docs/UX.md §7). */
const EXIT_ANIMATION_MS = 220;

/**
 * Прогоняет `CardTypeDef.execute()` и репортит снимки состояния через
 * `onUpdate`. Вынесена из хука отдельной функцией (не хуком), чтобы её же
 * мог использовать групповой сценарий («Подтвердить все P3») в `CardQueue`,
 * где карточек много и завести по хуку на каждую нельзя — хуки не вызываются
 * в цикле.
 */
export async function runCardExecution<P>(
  cardType: CardTypeDef<P>,
  payload: P,
  card: ActionCard<P>,
  onUpdate: (snapshot: ExecutionSnapshot) => void,
  isCancelled: () => boolean,
): Promise<void> {
  let steps: TaskStep[] = [];
  let progress: ExecutionSnapshot['progress'];

  function applyStep(event: Extract<TaskEvent, { t: 'step' }>) {
    const next = [...steps];
    for (let i = 0; i < event.index; i += 1) {
      const existing = next[i];
      if (existing) next[i] = { ...existing, state: 'done' };
    }
    next[event.index] = { label: event.label, state: 'active' };
    steps = next;
  }

  function markAllDone() {
    steps = steps.map((step) => (step.state === 'failed' ? step : { ...step, state: 'done' }));
  }

  function markActiveFailed() {
    const activeIndex = steps.findIndex((step) => step.state === 'active');
    if (activeIndex === -1) return;
    const next = [...steps];
    const existing = next[activeIndex];
    if (existing) next[activeIndex] = { ...existing, state: 'failed' };
    steps = next;
  }

  if (isCancelled()) return;
  onUpdate({ phase: 'executing', steps, progress });

  try {
    for await (const event of cardType.execute(payload, card)) {
      if (isCancelled()) return;

      switch (event.t) {
        case 'step':
          applyStep(event);
          onUpdate({ phase: 'executing', steps, progress });
          break;
        case 'progress':
          progress = { done: event.done, total: event.total };
          onUpdate({ phase: 'executing', steps, progress });
          break;
        case 'succeeded':
          markAllDone();
          onUpdate({ phase: 'done', steps, progress, doneAt: new Date().toISOString() });
          return;
        case 'failed':
          markActiveFailed();
          onUpdate({ phase: 'failed', steps, progress, message: event.message });
          return;
        default: {
          const exhaustive: never = event;
          void exhaustive;
        }
      }
    }
  } catch (error) {
    if (isCancelled()) return;
    const message = error instanceof Error ? error.message : 'Не удалось выполнить действие.';
    markActiveFailed();
    onUpdate({ phase: 'failed', steps, progress, message });
    return;
  }

  // Поток закончился без терминального события — на моках такого не бывает,
  // но честнее считать это неудачей, чем молча зависать в "executing".
  if (import.meta.env.DEV) {
    console.warn(`[useCardDecision] execute() карточки "${card.id}" завершился без succeeded/failed.`);
  }
  onUpdate({ phase: 'failed', steps, progress, message: 'Исполнение прервано без результата.' });
}

export type UseCardDecisionOptions<P> = {
  card: ActionCard<P>;
  cardType: CardTypeDef<P>;
  /** Карточка получила решение — владелец очереди начинает держать её в оверлее поверх `pending`-списка. */
  onDecided?: (card: ActionCard<P>) => void;
  /** Оверлей можно снять — карточка окончательно покидает очередь. */
  onSettled?: (cardId: Id) => void;
};

export function useCardDecision<P>({ card, cardType, onDecided, onSettled }: UseCardDecisionOptions<P>) {
  const decide = useStore((s) => s.decide);
  const undoDecision = useStore((s) => s.undoDecision);
  const setCardState = useStore((s) => s.setCardState);
  const setCardFailure = useStore((s) => s.setCardFailure);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayloadState] = useState<P>(card.payload);
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const [execution, setExecution] = useState<ExecutionSnapshot>(IDLE_EXECUTION);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);
  const lastPayloadRef = useRef<P>(card.payload);
  const lastDecidedCardRef = useRef<ActionCard<P>>(card);
  const pendingDecisionRef = useRef<{ decision: CardDecision; payload?: P } | null>(null);
  const settleTimerRef = useRef<number | undefined>(undefined);
  const exitTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Явно, а не только начальным `useRef(true)`: React StrictMode в dev
    // на монтировании гоняет setup → cleanup → setup ещё раз, чтобы поймать
    // эффекты без очистки. Без явного `= true` здесь первый лишний cleanup
    // насовсем гасил бы `mountedRef` в `false`, и `isCancelled()` считала бы
    // компонент отмонтированным сразу после монтирования — `startExecution`
    // тогда бы даже не подавал первый `onUpdate`.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  const changedKeys = useMemo(() => diffPayload(card.payload, editedPayload), [card.payload, editedPayload]);

  /**
   * Ошибки показываются только после попытки подтвердить и снимаются при
   * первой же правке: подсвечивать пустое поле, к которому юрист ещё не
   * притронулся, — значит ругаться раньше, чем человек что-то сделал.
   */
  const setEditedPayload = useCallback((next: P) => {
    setEditedPayloadState(next);
    setErrors(NO_ERRORS);
  }, []);

  /**
   * Двухфазный уход из очереди (docs/UX.md §7 «карточка решена»): сперва
   * ждём `delayMs` (для `done` — время показать «Выполнено», для `reject` —
   * 0, сразу), затем на `EXIT_ANIMATION_MS` включаем `isExiting` (сжатие +
   * затухание) и только по его истечении зовём `onSettled` — до этого
   * момента `CardQueue` обязана продолжать рендерить карточку, иначе
   * анимации ухода никто не увидит.
   */
  const scheduleSettle = useCallback(
    (delayMs: number) => {
      settleTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setIsExiting(true);
        exitTimerRef.current = window.setTimeout(() => {
          onSettled?.(card.id);
        }, EXIT_ANIMATION_MS);
      }, delayMs);
    },
    [card.id, onSettled],
  );

  const startExecution = useCallback(
    (payload: P, decidedCard: ActionCard<P>) => {
      cancelledRef.current = false;
      lastPayloadRef.current = payload;
      lastDecidedCardRef.current = decidedCard;
      setCardState(card.id, 'executing');
      setExecution(IDLE_EXECUTION);

      void runCardExecution(
        cardType,
        payload,
        decidedCard,
        (snapshot) => {
          if (!mountedRef.current) return;
          setExecution(snapshot);

          if (snapshot.phase === 'done') {
            setCardState(card.id, 'done');
            scheduleSettle(DONE_LINGER_MS);
          } else if (snapshot.phase === 'failed') {
            setCardFailure(card.id, { message: snapshot.message ?? 'Не удалось выполнить.', retryable: true });
          }
        },
        () => cancelledRef.current || !mountedRef.current,
      );
    },
    [card.id, cardType, scheduleSettle, setCardFailure, setCardState],
  );

  const runDecision = useCallback(
    (decision: CardDecision, payload?: P, opts?: { skipToast?: boolean }) => {
      decide(card.id, decision, payload);
      const decidedCard: ActionCard<P> = {
        ...card,
        state: decision === 'accept' ? 'accepted' : decision === 'modify' ? 'modified' : 'rejected',
        modifiedPayload: decision === 'modify' ? payload : undefined,
        decidedAt: new Date().toISOString(),
      };
      onDecided?.(decidedCard);

      if (decision === 'reject') {
        if (!opts?.skipToast) {
          toast({
            title: 'Карточка отклонена',
            description: card.title,
            action: { label: 'Отменить', onClick: () => undoDecision(card.id) },
            duration: 6000,
          });
        }
        scheduleSettle(0);
        return;
      }

      if (!opts?.skipToast) {
        toast({
          title: decision === 'accept' ? 'Подтверждено' : 'Изменения сохранены и подтверждены',
          description: card.title,
          action: {
            label: 'Отменить',
            onClick: () => {
              cancelledRef.current = true;
              if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
              if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
              undoDecision(card.id);
              onSettled?.(card.id);
            },
          },
          duration: 6000,
        });
      }

      startExecution(payload ?? card.payload, decidedCard);
    },
    [card, decide, onDecided, onSettled, scheduleSettle, startExecution, toast, undoDecision],
  );

  /** Решение проходит через диалог для `destructive`-типов (accept/modify), напрямую — для остальных. */
  const requestDecision = useCallback(
    (decision: CardDecision, payload?: P) => {
      if (cardType.destructive) {
        pendingDecisionRef.current = { decision, payload };
        setDestructiveOpen(true);
        return;
      }
      runDecision(decision, payload);
    },
    [cardType.destructive, runDecision],
  );

  const accept = useCallback(() => requestDecision('accept'), [requestDecision]);
  const reject = useCallback(() => runDecision('reject'), [runDecision]);

  const startEdit = useCallback(() => {
    setEditedPayloadState(card.payload);
    setErrors(NO_ERRORS);
    setIsEditing(true);
  }, [card.payload]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedPayloadState(card.payload);
    setErrors(NO_ERRORS);
  }, [card.payload]);

  /**
   * Правка уходит в решение, только если прошла проверку типа карточки.
   * Иначе форма остаётся открытой с ошибками у полей — молча подтверждать
   * пустое уведомление или платёж на ноль нельзя (docs/UX.md §2).
   */
  const confirmEdit = useCallback(() => {
    const found = validateCardDecision(cardType, editedPayload);
    if (hasErrors(found)) {
      setErrors(found);
      return;
    }
    setErrors(NO_ERRORS);
    setIsEditing(false);
    requestDecision('modify', editedPayload);
  }, [cardType, editedPayload, requestDecision]);

  const confirmDestructive = useCallback(() => {
    const pending = pendingDecisionRef.current;
    pendingDecisionRef.current = null;
    setDestructiveOpen(false);
    if (!pending) return;
    runDecision(pending.decision, pending.payload, { skipToast: true });
  }, [runDecision]);

  const cancelDestructive = useCallback(() => {
    pendingDecisionRef.current = null;
    setDestructiveOpen(false);
  }, []);

  const retry = useCallback(() => {
    setCardFailure(card.id, undefined);
    startExecution(lastPayloadRef.current, lastDecidedCardRef.current);
  }, [card.id, setCardFailure, startExecution]);

  return {
    isEditing,
    editedPayload,
    setEditedPayload,
    errors,
    changedKeys,
    startEdit,
    cancelEdit,
    confirmEdit,
    accept,
    reject,
    retry,
    execution,
    isExiting,
    destructiveOpen,
    confirmDestructive,
    cancelDestructive,
  };
}

export type UseCardDecisionResult<P> = ReturnType<typeof useCardDecision<P>>;
