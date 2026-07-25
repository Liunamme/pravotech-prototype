import { Bot, RotateCcw, TriangleAlert } from 'lucide-react';
import type { Message } from '@/types/domain';
import { Button } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import { AgentStatusLine } from '../AgentStatusLine';
import { MessageBlockView } from './MessageBlockView';
import styles from './MessageItem.module.css';

export type MessageItemProps = {
  message: Message;
  onRetry: (messageId: string) => void;
  onOptionSelect: (option: string) => void;
};

const ROLE_LABEL: Record<Message['role'], string> = {
  agent: 'ПравоТех',
  user: 'Вы',
  system: 'Система',
};

/**
 * Одна реплика треда. Роли различаются выравниванием, поверхностью и
 * текстовой меткой — намеренно без «пузырей» мессенджера (ТЗ 4b.2):
 * это рабочий инструмент юриста, а не переписка.
 */
export function MessageItem({ message, onRetry, onOptionSelect }: MessageItemProps) {
  const isAgent = message.role === 'agent';
  const isStreaming = message.status === 'streaming';
  const lastBlockIndex = message.blocks.length - 1;

  return (
    <div className={cn(styles.row, styles[`role_${message.role}`])}>
      {isAgent && (
        <div className={styles.avatar} aria-hidden="true">
          <Bot size={16} strokeWidth={2} />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.roleLabel}>{ROLE_LABEL[message.role]}</span>
          <span className={styles.time}>{formatDateTime(message.createdAt)}</span>
        </div>

        {isStreaming && message.statusLine && <AgentStatusLine status={message.statusLine} />}

        {message.blocks.length > 0 && (
          // `aria-live="polite"`, не `assertive` — не забивает скринридер
          // потоком токенов (ТЗ 4b.3). Регион читает только у агента: реплики
          // пользователя не стримятся, дублировать им живой регион незачем.
          <div className={styles.blocks} aria-live={isAgent ? 'polite' : undefined}>
            {message.blocks.map((block, index) => (
              // Ключи списков в проекте обязаны быть стабильным `id`, не индексом
              // (SPEC 4) — но `MessageBlock` (src/types/domain.ts, вне границ
              // этой задачи) намеренно не несёт `id`, а `threadsSlice.appendBlock`
              // только дописывает в конец и никогда не переставляет/не вставляет
              // в середину. При этом инварианте позиция в массиве — стабильный
              // идентификатор блока на весь срок жизни сообщения, а не суррогат.
              <MessageBlockView
                key={index}
                block={block}
                showCursor={isStreaming && index === lastBlockIndex}
                previousBlock={index > 0 ? message.blocks[index - 1] : undefined}
                onOptionSelect={onOptionSelect}
              />
            ))}
          </div>
        )}

        {message.status === 'error' && message.error && (
          <div className={styles.errorBox} role="alert">
            <TriangleAlert size={16} strokeWidth={2} className={styles.errorIcon} aria-hidden="true" />
            <p className={styles.errorMessage}>{message.error.message}</p>
            {message.error.retryable && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<RotateCcw size={14} strokeWidth={2} />}
                onClick={() => onRetry(message.id)}
              >
                Повторить
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
