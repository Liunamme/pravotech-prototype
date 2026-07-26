import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type UIEvent,
} from 'react';
import { Inbox } from 'lucide-react';
import type { ActionCard, Id, Priority } from '@/types/domain';
import { PRIORITIES, TODAY_SCOPE } from '@/types/domain';
import { useStore } from '@/store';
import { selectTodayQueue, selectWorkspaceQueue } from '@/store/selectors';
import { Button, EmptyState, ScrollArea, useToast } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { CardRenderer } from '../CardRenderer';
import styles from './CardQueue.module.css';

export type CardQueueProps = {
  /** `'today'` — сквозная очередь всех пространств, иначе — id конкретного пространства (docs/UX.md §3). */
  scope: typeof TODAY_SCOPE | Id;
};

const GROUP_LABEL: Record<Priority, string> = {
  P0: 'P0 · Срочно',
  P1: 'P1 · Сегодня',
  P2: 'P2 · На неделе',
  P3: 'P3 · Фоном',
};

/**
 * Очередь карточек действий (docs/UX.md §3). Работает и как «Сегодня»
 * (`scope: 'today'`, сквозь все пространства), и как очередь пространства
 * (`scope: workspaceId`) — один и тот же компонент, разный срез стора.
 *
 * `selectTodayQueue`/`selectWorkspaceQueue` отдают только `pending`:
 * `cardsSlice.decide()` переводит карточку в терминальное состояние сразу
 * же, поэтому решённая карточка in-memory покидает эти списки в тот же
 * момент. Чтобы она успела показать `executing → done`/`failed` и уехать
 * анимацией (а не исчезнуть рывком), очередь держит decided-id в локальном
 * оверлее `settlingIds` до сигнала `onSettled` от `useCardDecision`
 * (см. комментарий там же).
 */
export function CardQueue({ scope }: CardQueueProps) {
  const showWorkspace = scope === TODAY_SCOPE;
  const pendingCards = useStore((state) =>
    scope === TODAY_SCOPE ? selectTodayQueue(state) : selectWorkspaceQueue(state, scope),
  );
  const cards = useStore((state) => state.cards);
  const bulkAccept = useStore((state) => state.bulkAccept);
  const undoDecision = useStore((state) => state.undoDecision);
  const { toast } = useToast();

  const [settlingIds, setSettlingIds] = useState<ReadonlySet<Id>>(() => new Set());
  /** Id, решённые групповым «Подтвердить все P3» — сразу играют анимацию ухода (docs/UX.md §7), см. `ActionCardShell.forceExiting`. */
  const [bulkExitingIds, setBulkExitingIds] = useState<ReadonlySet<Id>>(() => new Set());
  const [expandedOverrides, setExpandedOverrides] = useState<Record<Id, boolean>>({});
  const [focusedId, setFocusedId] = useState<Id | null>(null);
  /**
   * Есть ли скрытый контент за верхним/нижним краем ленты — по этому включаются
   * размытые вуали у краёв (та же схема, что у `useScrollFade`: в дефолтной
   * позиции и у дна отделки нет, чтобы не мылить крайние карточки зря).
   */
  const [veils, setVeils] = useState({ top: false, bottom: false });
  /**
   * Заголовок какой группы сейчас «прилип» к верху. Считается по прокрутке, а
   * не через `position: sticky`: сами заголовки живут ВНУТРИ маски затухания и
   * гаснут вместе с карточками, поэтому наверху рисуется отдельная копия —
   * снаружи маски и потому резкая (см. `.stuckHeader` в CSS).
   */
  const [stuckGroup, setStuckGroup] = useState<Priority | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<Id, HTMLDivElement | null>>({});
  const headerRefs = useRef<Record<string, HTMLElement | null>>({});

  const measureVeils = useCallback((el: HTMLElement | null | undefined) => {
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setVeils((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));

    // Прилипшим считается последний заголовок, который уже ушёл за верхний край.
    const edge = el.getBoundingClientRect().top;
    let current: Priority | null = null;
    for (const [priority, node] of Object.entries(headerRefs.current)) {
      if (node && node.getBoundingClientRect().top <= edge + 1) current = priority as Priority;
    }
    setStuckGroup((prev) => (prev === current ? prev : current));
  }, []);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    measureVeils(event.currentTarget);
  }

  const handleDecided = useCallback((card: ActionCard) => {
    setSettlingIds((prev) => {
      if (prev.has(card.id)) return prev;
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
  }, []);

  const handleSettled = useCallback((cardId: Id) => {
    setSettlingIds((prev) => {
      if (!prev.has(cardId)) return prev;
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, []);

  const visibleCards = useMemo(() => {
    const seen = new Set(pendingCards.map((c) => c.id));
    const extra: ActionCard[] = [];
    for (const id of settlingIds) {
      if (seen.has(id)) continue;
      const card = cards[id];
      if (card && (scope === TODAY_SCOPE || card.workspaceId === scope)) extra.push(card);
    }
    return [...pendingCards, ...extra];
  }, [pendingCards, settlingIds, cards, scope]);

  const groups = useMemo(() => {
    const byPriority = new Map<Priority, ActionCard[]>();
    for (const card of visibleCards) {
      const list = byPriority.get(card.priority);
      if (list) list.push(card);
      else byPriority.set(card.priority, [card]);
    }
    return PRIORITIES.map((priority) => ({ priority, items: byPriority.get(priority) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [visibleCards]);

  // Первичный замер и пересчёт при смене состава ленты: без него нижняя вуаль
  // появилась бы только после первой прокрутки.
  useEffect(() => {
    measureVeils(rootRef.current?.querySelector<HTMLElement>('[data-queue-scroll]'));
  }, [measureVeils, visibleCards]);

  const orderedIds = useMemo(() => visibleCards.map((c) => c.id), [visibleCards]);
  const activeId = focusedId && orderedIds.includes(focusedId) ? focusedId : (orderedIds[0] ?? null);

  const p3PendingIds = useMemo(
    () => pendingCards.filter((c) => c.priority === 'P3').map((c) => c.id),
    [pendingCards],
  );

  function isExpanded(card: ActionCard): boolean {
    const override = expandedOverrides[card.id];
    return override !== undefined ? override : card.priority === 'P0';
  }

  function setExpanded(id: Id, value: boolean) {
    setExpandedOverrides((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));
  }

  function handleBulkAccept() {
    if (p3PendingIds.length === 0) return;
    const ids = [...p3PendingIds];
    bulkAccept(ids);
    setSettlingIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    setBulkExitingIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setSettlingIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setBulkExitingIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, 220);
    toast({
      title: `Подтверждено: ${ids.length} P3`,
      description: 'Рутинные карточки подтверждены без исполнения — это фоновая пачка.',
      action: {
        label: 'Отменить',
        onClick: () => {
          for (const id of ids) undoDecision(id);
        },
      },
      duration: 6000,
    });
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const isFormControl = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

    if (event.key === 'Escape') {
      const rowEl = target.closest<HTMLElement>('[data-card-id]');
      const rowId = rowEl?.dataset.cardId;
      if (rowId) setExpanded(rowId, false);
      (document.activeElement as HTMLElement | null)?.blur();
      return;
    }

    if (isFormControl) return; // не мешаем стрелкам внутри полей EditForm

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (orderedIds.length === 0) return;
      event.preventDefault();
      const currentIndex = activeId ? orderedIds.indexOf(activeId) : -1;
      const nextIndex =
        event.key === 'ArrowDown'
          ? Math.min(orderedIds.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1);
      const nextId = orderedIds[nextIndex];
      if (!nextId) return;
      setFocusedId(nextId);
      setExpanded(nextId, true);
      rowRefs.current[nextId]?.focus();
    }
  }

  if (groups.length === 0) {
    return (
      <div className={styles.root}>
        <EmptyState
          className={styles.empty}
          icon={Inbox}
          title="Очередь разобрана"
          description="Все предложения агента рассмотрены. Новые появятся, когда агент найдёт что-то требующее решения."
        />
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      {/* Копия заголовка прилипшей группы — СНАРУЖИ прокрутки, а значит вне
          маски затухания: только так он остаётся резким, пока карточки под
          ним растворяются. Оригинал продолжает ехать в потоке и задаёт, какая
          группа считается текущей. */}
      {stuckGroup && (
        <div className={styles.stuckHeader} aria-hidden="true">
          <span className={cn(styles.groupLabel, styles[`priority_${stuckGroup}`])}>{GROUP_LABEL[stuckGroup]}</span>
          <span className={styles.groupCount}>
            {groups.find((group) => group.priority === stuckGroup)?.items.length ?? 0}
          </span>
        </div>
      )}

      <ScrollArea
        className={styles.scroll}
        data-queue-scroll=""
        style={
          {
            '--fade-top': veils.top ? '38px' : '0px',
            '--fade-bottom': veils.bottom ? '24px' : '0px',
          } as CSSProperties
        }
        onKeyDown={handleListKeyDown}
        onScroll={handleScroll}
        shadows={false}
      >
        <div className={styles.list}>
          {groups.map((group) => (
            <section key={group.priority} className={styles.group} aria-label={GROUP_LABEL[group.priority]}>
              <header
                className={styles.groupHeader}
                ref={(node) => {
                  headerRefs.current[group.priority] = node;
                }}
              >
                <span className={cn(styles.groupLabel, styles[`priority_${group.priority}`])}>
                  {GROUP_LABEL[group.priority]}
                </span>
                <span className={styles.groupCount}>{group.items.length}</span>
              </header>

              {group.priority === 'P3' && p3PendingIds.length > 0 && (
                <Button variant="secondary" size="sm" className={styles.bulkRow} onClick={handleBulkAccept}>
                  Подтвердить все P3 ({p3PendingIds.length})
                </Button>
              )}

              <div className={cn(styles.groupList)}>
                {group.items.map((card) => (
                  <CardRenderer
                    key={card.id}
                    cardId={card.id}
                    showWorkspace={showWorkspace}
                    expanded={isExpanded(card)}
                    onExpandChange={(value) => setExpanded(card.id, value)}
                    tabIndex={card.id === activeId ? 0 : -1}
                    rootRef={(el) => {
                      rowRefs.current[card.id] = el;
                    }}
                    onDecided={handleDecided}
                    onSettled={handleSettled}
                    forceExiting={bulkExitingIds.has(card.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Зеркальная вуаль у нижнего края — лента уходит в размытие, а не
            обрывается по границе колонки. */}
      </ScrollArea>
    </div>
  );
}
