import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { TODAY_SCOPE, type Id, type ThreadScope, type ThreadStatus } from '@/types/domain';
import type { AgentSkill } from '@/workspaces/types';
import { getWorkspace, workspaces } from '@/workspaces/registry';
import { Badge, type BadgeVariant } from '@/shared/ui';
import { useStore } from '@/store';
import { selectThreadMessages } from '@/store/selectors';
import { useAgentStream } from '../useAgentStream';
import { MessageList, type MessageListHandle } from '../MessageList';
import { Composer, type ComposerHandle } from '../Composer';
import styles from './ChatView.module.css';

/**
 * Навыки для чипов-подсказок пустого треда (docs/UX.md §6). Для конкретного
 * пространства — его собственный манифест (`WorkspaceManifest.skills`,
 * docs/DOMAIN.md §8). Для «Сегодня» пространства ещё не выбрано, поэтому
 * берём сводный список — по паре навыков от каждого пространства реестра,
 * чтобы подсказки на дневном экране не разрастались в длинную ленту.
 */
const TODAY_SKILLS_PER_WORKSPACE = 2;

function getScopeSkills(scope: ThreadScope): AgentSkill[] {
  if (scope === TODAY_SCOPE) {
    return workspaces.flatMap((workspace) => workspace.skills.slice(0, TODAY_SKILLS_PER_WORKSPACE));
  }
  return getWorkspace(scope)?.skills ?? [];
}

export type ChatViewProps = {
  threadId: Id;
  scope: ThreadScope;
  /**
   * Если задано и при монтировании тред пуст — один раз за сессию браузера
   * запускает этот ввод через `transport.send()` без видимой реплики
   * пользователя (ТЗ 4b.9, автозапуск `morningDigest` на «Сегодня»).
   * Гвард — `sessionStorage`, не модульная переменная: должен переживать
   * переход на другую страницу и обратно в рамках вкладки, но не F5.
   */
  autoRunOnEmpty?: string;
};

const STATUS_LABEL: Record<ThreadStatus, string> = {
  active: 'Активен',
  awaiting_user: 'Ждёт вас',
  working: 'Агент работает',
  done: 'Завершён',
};

const STATUS_VARIANT: Record<ThreadStatus, BadgeVariant> = {
  active: 'neutral',
  awaiting_user: 'warning',
  working: 'accent',
  done: 'success',
};

/**
 * Контейнер живого чата (ТЗ 4b.1): шапка + прокручиваемый список + композер.
 * Шапка и композер закреплены, скроллится только `MessageList`.
 */
export function ChatView({ threadId, scope, autoRunOnEmpty }: ChatViewProps) {
  const thread = useStore((state) => state.threads[threadId]);
  const messages = useStore((state) => selectThreadMessages(state, threadId));
  const chat = useAgentStream(threadId, scope);
  const skills = useMemo(() => getScopeSkills(scope), [scope]);

  const listRef = useRef<MessageListHandle>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(messages.length);
  const autoRunFiredRef = useRef(false);

  useEffect(() => {
    if (!autoRunOnEmpty || autoRunFiredRef.current) return;
    autoRunFiredRef.current = true;
    if (messages.length > 0) return; // история уже есть — автодайджест не по адресу

    const key = `pravotech:auto-run:${threadId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
    chat.runTrigger(autoRunOnEmpty);
    // `chat` — новый объект на каждый рендер (useAgentStream), сознательно
    // не в зависимостях: эффект обязан выполниться ровно раз на монтирование
    // треда, а не при каждой смене ссылки на хук.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, autoRunOnEmpty]);

  // Автопрокрутка вниз при новых токенах — но только пока пользователь сам
  // не проскроллил вверх (ТЗ 4b.1). Мгновенный скролл (не smooth): при
  // потоке токенов каждые 16–34мс smooth-анимация только дёргалась бы.
  useLayoutEffect(() => {
    const prevCount = prevCountRef.current;
    const grew = messages.length > prevCount;
    prevCountRef.current = messages.length;

    if (atBottom) {
      listRef.current?.scrollToBottom(false);
    } else if (grew) {
      setPendingCount((count) => count + (messages.length - prevCount));
    }
  }, [messages, atBottom]);

  function handleAtBottomChange(next: boolean) {
    setAtBottom(next);
    if (next) setPendingCount(0);
  }

  function handleScrollDownClick() {
    listRef.current?.scrollToBottom(true);
    setAtBottom(true);
    setPendingCount(0);
  }

  function handleOptionSelect(option: string) {
    chat.sendUserMessage(option);
  }

  function handlePickSkill(prompt: string) {
    composerRef.current?.prefill(prompt);
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{thread?.title ?? 'Тред'}</h2>
          {thread && (
            <Badge variant={STATUS_VARIANT[thread.status]} size="sm">
              {STATUS_LABEL[thread.status]}
            </Badge>
          )}
        </div>
        {thread?.subjectRef && <p className={styles.subject}>{thread.subjectRef.label}</p>}
      </header>

      <div className={styles.listArea}>
        <MessageList
          ref={listRef}
          messages={messages}
          skills={skills}
          onPickSkill={handlePickSkill}
          onRetry={chat.retry}
          onOptionSelect={handleOptionSelect}
          onAtBottomChange={handleAtBottomChange}
        />

        {!atBottom && (
          <button
            type="button"
            className={styles.scrollDown}
            onClick={handleScrollDownClick}
            aria-label={
              pendingCount > 0 ? `Прокрутить вниз, новых сообщений: ${pendingCount}` : 'Прокрутить вниз к последним сообщениям'
            }
          >
            <ArrowDown size={16} strokeWidth={2} />
            {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
          </button>
        )}
      </div>

      <Composer
        ref={composerRef}
        isStreaming={chat.isStreaming}
        onSend={chat.sendUserMessage}
        onStop={chat.cancel}
      />
    </div>
  );
}
