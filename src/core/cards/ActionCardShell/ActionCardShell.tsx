import { useRef, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import type { ActionCard, Id } from '@/types/domain';
import { TODAY_SCOPE } from '@/types/domain';
import type { CardTypeDef } from '@/workspaces/types';
import { getWorkspace } from '@/workspaces/registry';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PriorityBadge,
  Tooltip,
} from '@/shared/ui';
import type { DeadlineUrgency } from '@/shared/lib/date';
import { formatDate, formatDateTime, formatDeadline } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import { useStore } from '@/store';
import { CitationChip } from '@/core/chat/CitationChip';
import { diffPayload } from '../diffPayload';
import { useCardDecision } from '../useCardDecision';
import type { UseCardDecisionResult } from '../useCardDecision';
import { ExecutionSteps } from './ExecutionSteps';
import styles from './ActionCardShell.module.css';

export type ActionCardShellProps<P> = {
  card: ActionCard<P>;
  cardType: CardTypeDef<P>;
  /** «Сегодня» показывает, из какого пространства карточка — в своём пространстве это шум (docs/UX.md §3). */
  showWorkspace?: boolean;
  /** Карточка отрисована внутри чата (card_ref) — прячет «Показать в чате». */
  inChat?: boolean;
  expanded: boolean;
  onExpandChange: (next: boolean) => void;
  /** Roving tabindex очереди (docs/UX.md §3); вне очереди (чат) — обычная фокусируемость. */
  tabIndex?: number;
  rootRef?: (el: HTMLDivElement | null) => void;
  /** Карточка получила решение — владелец очереди начинает оверлей поверх `pending`-списка. */
  onDecided?: (card: ActionCard<P>) => void;
  /** Оверлей можно снять — карточка окончательно покидает очередь. */
  onSettled?: (cardId: Id) => void;
  /**
   * Карточка решена в обход этого экземпляра хука — групповое «Подтвердить
   * все P3» (`CardQueue`) меняет состояние в сторе напрямую, без
   * прохождения через `useCardDecision` этой конкретной карточки. Без этого
   * прокинутого флага такая карточка пропала бы из очереди рывком, без
   * анимации «решена» (docs/UX.md §7).
   */
  forceExiting?: boolean;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a, input, textarea, select, [role="button"]'));
}

function pluralField(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'полей';
  if (mod10 === 1) return 'поле';
  if (mod10 >= 2 && mod10 <= 4) return 'поля';
  return 'полей';
}

/** «через 2 дня, 26 июля» / «сегодня до 18:00» / «просрочено на 2 дня» / «12 сентября» (docs/UX.md §5). */
function describeDeadline(dueAt: string): { text: string; urgency: DeadlineUrgency } {
  const { text, urgency } = formatDeadline(dueAt);

  if (urgency === 'today') {
    // formatDateTime → "24 июля 2026, 14:30"; время — то, что после запятой.
    // Нет отдельного форматтера "только время" в shared/lib/date.ts (вне
    // границ этой задачи) — производный разбор санкционированного
    // форматтера, не прямой вызов date-fns (SPEC 4).
    const time = formatDateTime(dueAt).split(', ')[1];
    return { text: time && time !== '00:00' ? `Сегодня до ${time}` : 'Сегодня', urgency };
  }
  if (urgency === 'soon') {
    return { text: `${text}, ${formatDate(dueAt)}`, urgency };
  }
  if (urgency === 'normal') {
    return { text: formatDate(dueAt), urgency };
  }
  return { text, urgency };
}

/**
 * Хромировка карточки действия (docs/UX.md §2) — общая для всех типов.
 * Специфику типа рисует `CardTypeDef.Body`/`EditForm`, здесь — идентификация,
 * плотность по приоритету, привязка, источники, три исхода и состояния
 * исполнения. `CardRenderer` — единственная точка, которая до неё доводит.
 */
export function ActionCardShell<P>({
  card,
  cardType,
  showWorkspace = false,
  inChat = false,
  expanded,
  onExpandChange,
  tabIndex = 0,
  rootRef,
  onDecided,
  onSettled,
  forceExiting = false,
}: ActionCardShellProps<P>) {
  const {
    isEditing,
    editedPayload,
    setEditedPayload,
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
  } = useCardDecision({ card, cardType, onDecided, onSettled });

  const originThread = useStore((state) => (card.originThreadId ? state.threads[card.originThreadId] : undefined));
  const subjectDoc = useStore((state) => (card.subjectRef ? state.documents[card.subjectRef.id] : undefined));
  const openInspector = useStore((state) => state.openInspector);
  const [searchParams, setSearchParams] = useSearchParams();

  /** Открывает предмет карточки (договор/дело) в инспекторе — как чипы ссылок и строки сроков. */
  function openSubject() {
    const docId = card.subjectRef?.id;
    if (!docId) return;
    openInspector(docId);
    const next = new URLSearchParams(searchParams);
    next.set('doc', docId);
    next.delete('anchor');
    setSearchParams(next);
  }
  const workspace = showWorkspace ? getWorkspace(card.workspaceId) : undefined;
  const WorkspaceIcon = workspace?.icon;
  const TypeIcon = cardType.icon;

  const summaryAlways = card.priority === 'P0' || card.priority === 'P1';
  const isBusy = execution.phase !== 'idle';
  const effectiveExpanded = isEditing || isBusy || expanded;

  const deadline = card.dueAt ? describeDeadline(card.dueAt) : null;
  const bodyPayload = card.modifiedPayload ?? card.payload;
  const modifiedDiffKeys =
    card.state === 'modified' && card.modifiedPayload ? diffPayload(card.payload, card.modifiedPayload) : null;

  const originLink =
    originThread && originThread.workspaceId === TODAY_SCOPE
      ? '/today'
      : originThread
        ? `/w/${originThread.workspaceId}/t/${originThread.id}`
        : undefined;

  /*
   * Мышиный клик по ещё не сфокусированной карточке рождает ДВА события
   * подряд: `mousedown` сдвигает фокус на строку раньше, чем успевает
   * дойти сам `click` (браузер фокусирует кликнутый элемент на mousedown).
   * Без этого флага `handleFocus` уже открыл бы карточку к моменту, когда
   * долетает `click`, а `handleClick`, наивно читая `!expanded`, тут же
   * закрыл бы её обратно — снаружи это выглядело бы как «клик не работает».
   * Флаг помечает «раскрытие уже случится само по фокусу, `click` не должен
   * с ним спорить» и живёт ровно один клик — `mouseup` подчищает его на
   * случай, если фокус ушёл не на саму строку (клик по кнопке внутри).
   */
  const pointerDownRef = useRef(false);

  function handleMouseDown() {
    pointerDownRef.current = true;
  }

  function handleMouseUp() {
    pointerDownRef.current = false;
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) return;
    onExpandChange(!expanded);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isEditing && event.key === 'Escape') {
      event.stopPropagation();
      cancelEdit();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && !isInteractiveTarget(event.target)) {
      event.preventDefault();
      onExpandChange(!expanded);
    }
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (pointerDownRef.current) {
      // Раскрытие сейчас решит `handleClick`, который вот-вот придёт следом.
      pointerDownRef.current = false;
      return;
    }
    onExpandChange(true);
  }

  return (
    <Card
      ref={rootRef}
      className={cn(styles.root, (isExiting || forceExiting) && styles.exiting)}
      data-card-id={card.id}
      data-priority={card.priority}
      role="group"
      aria-expanded={effectiveExpanded}
      aria-label={`${cardType.label}: ${card.title}`}
      tabIndex={isExiting || forceExiting ? -1 : tabIndex}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={styles.idRow}>
        <div className={styles.idLeft}>
          <PriorityBadge priority={card.priority} />
          {/* Название типа усекается первым: заголовок карточки ниже уже говорит,
              что делать. В узком контейнере остаётся иконка — её значение
              раскрывает тултип, а не обрубок вида «Уведом…». */}
          <Tooltip side="top" content={cardType.label}>
            <span className={styles.typeIcon} tabIndex={0} aria-label={`Тип: ${cardType.label}`}>
              <TypeIcon size={14} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </Tooltip>
          <span className={styles.typeLabel}>{cardType.label}</span>
          {showWorkspace && workspace && (
            <Badge variant="neutral" size="sm" className={styles.workspaceBadge}>
              {WorkspaceIcon && <WorkspaceIcon size={11} strokeWidth={1.75} aria-hidden="true" />}
              {workspace.shortTitle}
            </Badge>
          )}
        </div>
        {deadline && (
          <span className={cn(styles.deadline, styles[`deadline_${deadline.urgency}`])}>{deadline.text}</span>
        )}
      </div>

      <p className={styles.title}>{card.title}</p>

      {summaryAlways && <p className={styles.summary}>{card.summary}</p>}

      <div className={styles.collapsible} style={{ gridTemplateRows: effectiveExpanded ? '1fr' : '0fr' }}>
        <div className={styles.collapsibleInner}>
          {!summaryAlways && <p className={styles.summary}>{card.summary}</p>}

          {/* Предмет карточки — договор или дело. Ведёт в сам документ, а не в
              пространство: раньше ссылка открывала `/w/:id` без треда, то есть
              пустое приглашение «О чём поговорим?». Если документа нет в сторе,
              подпись остаётся текстом, а не ссылкой в никуда. */}
          {card.subjectRef &&
            (subjectDoc ? (
              <button
                type="button"
                className={styles.subjectRef}
                onClick={(e) => {
                  e.stopPropagation();
                  openSubject();
                }}
              >
                {card.subjectRef.label}
              </button>
            ) : (
              <span className={styles.subjectRefPlain}>{card.subjectRef.label}</span>
            ))}

          {modifiedDiffKeys && modifiedDiffKeys.size > 0 && (
            <p className={styles.diffNote}>
              Изменено юристом: {modifiedDiffKeys.size} {pluralField(modifiedDiffKeys.size)}
            </p>
          )}

          {card.sources.length > 0 && (
            <div className={styles.sources}>
              {card.sources.map((source, index) => (
                <CitationChip key={source.id} source={source} index={index + 1} variant="label" />
              ))}
            </div>
          )}

          <BodySlot
            isEditing={isEditing}
            isBusy={isBusy}
            cardType={cardType}
            card={card}
            bodyPayload={bodyPayload}
            editedPayload={editedPayload}
            onEditChange={setEditedPayload}
            changedKeys={changedKeys}
            execution={execution}
            onRetry={retry}
          />

          {/* «Показать в чате» бессмысленно, когда карточка уже отрисована в чате. */}
          {originLink && !inChat && (
            <Link to={originLink} className={styles.showInChat} onClick={(e) => e.stopPropagation()}>
              <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
              Показать в чате
            </Link>
          )}

          {!isBusy && (
            <div className={styles.actions}>
              {isEditing ? (
                <>
                  <Button variant="primary" className={styles.confirmButton} onClick={confirmEdit}>
                    Сохранить и подтвердить
                  </Button>
                  <Button variant="secondary" className={styles.editButton} onClick={cancelEdit}>
                    Отмена
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" className={styles.confirmButton} onClick={accept}>
                    {cardType.confirmLabel ?? 'Подтвердить'}
                  </Button>
                  {cardType.EditForm && (
                    <Button variant="secondary" className={styles.editButton} onClick={startEdit}>
                      Изменить
                    </Button>
                  )}
                  <Button variant="ghost" className={styles.rejectButton} onClick={reject}>
                    Отклонить
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={destructiveOpen} onOpenChange={(open) => !open && cancelDestructive()}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Подтвердить необратимое действие</DialogTitle>
            <DialogDescription>
              «{card.title}» нельзя будет отменить после подтверждения — действие уходит вовне (контрагенту, в суд).
              Отменить решение через тост здесь не получится.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelDestructive}>
              Отмена
            </Button>
            <Button variant="danger" onClick={confirmDestructive}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Тело слота: read-режим / форма правки / прогресс исполнения — взаимоисключающие представления одного места. */
function BodySlot<P>({
  isEditing,
  isBusy,
  cardType,
  card,
  bodyPayload,
  editedPayload,
  onEditChange,
  changedKeys,
  execution,
  onRetry,
}: {
  isEditing: boolean;
  isBusy: boolean;
  cardType: CardTypeDef<P>;
  card: ActionCard<P>;
  bodyPayload: P;
  editedPayload: P;
  onEditChange: (next: P) => void;
  changedKeys: Set<string>;
  execution: UseCardDecisionResult<P>['execution'];
  onRetry: () => void;
}): ReactNode {
  if (isBusy) {
    return <ExecutionSteps execution={execution} onRetry={onRetry} />;
  }
  if (isEditing) {
    return (
      <div className={styles.editArea}>
        {changedKeys.size > 0 && (
          <p className={styles.editHint}>
            Изменено {changedKeys.size} {pluralField(changedKeys.size)}
          </p>
        )}
        {cardType.EditForm && <cardType.EditForm payload={editedPayload} onChange={onEditChange} />}
      </div>
    );
  }
  return <cardType.Body payload={bodyPayload} card={card} />;
}
