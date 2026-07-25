import { useEffect, useRef, useState } from 'react';
import { FileQuestion } from 'lucide-react';
import type { Id } from '@/types/domain';
import type { ActionCard } from '@/types/domain';
import { getCardType } from '@/workspaces/registry';
import { useStore } from '@/store';
import { ActionCardShell } from '../ActionCardShell';
import styles from './CardRenderer.module.css';

export type CardRendererProps = {
  cardId: Id;
  /** «Сегодня» показывает бейдж пространства, своё пространство — нет (docs/UX.md §3). */
  showWorkspace?: boolean;
  /** Карточка внутри чата (card_ref) — прячет «Показать в чате». */
  inChat?: boolean;
  /**
   * Раскрытие управляется извне (роль `CardQueue` — клавиатурная навигация,
   * §3 UX.md). Без пары `expanded`/`onExpandChange` карточка управляет
   * раскрытием сама — так работает `card_ref`-блок чата, у которого нет
   * общей очереди для координации.
   */
  expanded?: boolean;
  onExpandChange?: (next: boolean) => void;
  tabIndex?: number;
  rootRef?: (el: HTMLDivElement | null) => void;
  onDecided?: (card: ActionCard) => void;
  onSettled?: (cardId: Id) => void;
  /** Решение пришло в обход этой карточки (групповое действие) — см. `ActionCardShellProps.forceExiting`. */
  forceExiting?: boolean;
};

/**
 * Мост карточки к реестру типов (docs/DOMAIN.md, `workspaces/types.ts`).
 * Единственная точка рендера `ActionCard` в приложении — «Сегодня»,
 * пространство и `card_ref`-блок чата используют её же, никогда не рисуют
 * карточку напрямую через `ActionCardShell`.
 *
 * Реестр пуст до этапа 6 (`workspaces/registry.ts`) — это штатный случай:
 * рендерится аккуратный fallback, а не падение приложения, плюс лог в dev.
 */
export function CardRenderer({
  cardId,
  showWorkspace = false,
  inChat = false,
  expanded,
  onExpandChange,
  tabIndex,
  rootRef,
  onDecided,
  onSettled,
  forceExiting,
}: CardRendererProps) {
  const card = useStore((state) => state.cards[cardId]);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && card) {
      initializedRef.current = true;
      setInternalExpanded(card.priority === 'P0');
    }
  }, [card]);

  if (!card) {
    if (import.meta.env.DEV) {
      console.warn(`[CardRenderer] Карточка "${cardId}" не найдена в сторе.`);
    }
    return (
      <div className={styles.fallback} role="note">
        <FileQuestion size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Карточка недоступна.</span>
      </div>
    );
  }

  const cardType = getCardType(card.workspaceId, card.type);
  if (!cardType) {
    if (import.meta.env.DEV) {
      console.warn(
        `[CardRenderer] Неизвестный тип карточки "${card.type}" в пространстве "${card.workspaceId}" (карточка "${card.id}"). Реестр пуст до этапа 6 — это ожидаемо.`,
      );
    }
    return (
      <div className={styles.fallback} role="note">
        <FileQuestion size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Неизвестный тип карточки{import.meta.env.DEV ? ` («${card.type}»)` : ''}.</span>
      </div>
    );
  }

  const isControlled = expanded !== undefined && onExpandChange !== undefined;

  return (
    <ActionCardShell
      card={card}
      cardType={cardType}
      showWorkspace={showWorkspace}
      inChat={inChat}
      expanded={isControlled ? expanded : internalExpanded}
      onExpandChange={isControlled ? (onExpandChange as (next: boolean) => void) : setInternalExpanded}
      tabIndex={tabIndex}
      rootRef={rootRef}
      onDecided={onDecided}
      onSettled={onSettled}
      forceExiting={forceExiting}
    />
  );
}
