import { forwardRef, useImperativeHandle, useRef, type UIEvent } from 'react';
import { MessageCircleQuestion } from 'lucide-react';
import type { Message } from '@/types/domain';
import type { AgentSkill } from '@/workspaces/types';
import { EmptyState } from '@/shared/ui';
import { MessageItem } from '../MessageItem';
import { SkillSuggestions } from '../SkillSuggestions';
import styles from './MessageList.module.css';

export type MessageListHandle = {
  scrollToBottom: (smooth?: boolean) => void;
};

export type MessageListProps = {
  messages: Message[];
  /** Навыки пространства для чипов-подсказок пустого треда (docs/UX.md §6). */
  skills: AgentSkill[];
  /** Клик по чипу навыка — подставляет `prompt` в композер (см. `ChatView`). */
  onPickSkill: (prompt: string) => void;
  onRetry: (messageId: string) => void;
  onOptionSelect: (option: string) => void;
  /** Сообщает `ChatView`, стоит ли сейчас скролл у нижнего края (для автопрокрутки и кнопки «Вниз»). */
  onAtBottomChange: (atBottom: boolean) => void;
};

/** Допуск в пикселях: «у нижнего края» не требует ровно 0. */
const BOTTOM_THRESHOLD = 48;

/**
 * Прокручиваемый список реплик. Использует `composes: scrollArea` напрямую
 * (не компонент `<ScrollArea>` из `shared/ui`) намеренно: этому месту нужен
 * настоящий `ref` на скролл-контейнер и `onScroll` с позицией края —
 * `<ScrollArea>` инкапсулирует свой `ref` и такого не отдаёт. `composes` из
 * `shared.module.css` — как раз более низкоуровневый примитив для таких
 * случаев (SPEC 4, п.3 разрешает `composes: scrollArea` в любом модуле).
 */
export const MessageList = forwardRef<MessageListHandle, MessageListProps>(function MessageList(
  { messages, skills, onPickSkill, onRetry, onOptionSelect, onAtBottomChange },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToBottom(smooth = false) {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    },
  }));

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
    onAtBottomChange(atBottom);
  }

  return (
    <div ref={scrollRef} className={styles.scroll} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <EmptyState
            icon={MessageCircleQuestion}
            title="О чём поговорим?"
            description="Спросите что угодно о делах и договорах — или начните с подсказки."
          />
          {skills.length > 0 && (
            <div className={styles.emptySkills}>
              <SkillSuggestions skills={skills} onPick={onPickSkill} />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} onRetry={onRetry} onOptionSelect={onOptionSelect} />
          ))}
        </div>
      )}
    </div>
  );
});
