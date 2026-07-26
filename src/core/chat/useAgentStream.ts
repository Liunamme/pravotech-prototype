/**
 * Оркестрация живого чата с агентом (docs/tech-task.md, этап 4b.8).
 *
 * Единственное место, где UI встречается с `AgentTransport`: компоненты
 * `core/chat/**` вызывают только этот хук, никогда `useAgentTransport()`
 * напрямую. Раскладывает `AsyncIterable<AgentEvent>` по действиям стора
 * (`threadsSlice`) — свежий React-компонент читает результат уже из стора,
 * а не из состояния хука.
 */

import { useCallback, useRef, useState } from 'react';
import type { AgentContext, AgentEvent, BackgroundTask, Id, Message, ThreadScope } from '@/types/domain';
import { useAgentTransport } from '@/core/agent/transport';
import { useStore } from '@/store';
import { selectThreadMessages } from '@/store/selectors';
import { NEW_THREAD_TITLE, threadTitleFromMessage } from '@/shared/lib/threadTitle';

export type UseAgentStreamResult = {
  /** Идёт ли сейчас поток, запущенный этим хуком (этим треда). */
  isStreaming: boolean;
  /** `id` сообщения агента, которое сейчас дописывается. */
  streamingMessageId: Id | null;
  /** Добавляет реплику пользователя и запускает прогон агента на её основе. */
  sendUserMessage: (text: string) => void;
  /**
   * Запускает прогон агента без видимой реплики пользователя — нужен для
   * автозапуска `morningDigest` при первом открытии «Сегодня» (4b.9).
   * Идёт через тот же `transport.send()`, что и обычные реплики: строка
   * `'дайджест'` совпадает по стемам с `morningDigest.match` (он проверяется
   * первым в реестре сценариев — `scenarios/index.ts`), поэтому автозапуск
   * честно проходит через транспорт вместо обхода его напрямую и получает
   * ту же отмену через `cancel()`, что и любой другой прогон.
   */
  runTrigger: (triggerText: string) => void;
  /** Перезапускает прогон с тем же вводом, что породил `messageId`, новым сообщением агента. */
  retry: (messageId: Id) => void;
  /** Прерывает активный поток этого треда через транспорт. */
  cancel: () => void;
};

export function useAgentStream(threadId: Id, scope: ThreadScope): UseAgentStreamResult {
  const transport = useAgentTransport();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<Id | null>(null);

  /**
   * Вход, породивший сообщение агента — нужен «Повторить» (4b.7). Живёт вне
   * стора намеренно: это внутренняя деталь оркестрации одного хука, а не
   * часть доменной модели сообщения (`Message` такого поля не имеет и не
   * должен — `src/types/domain.ts` вне области этой задачи).
   */
  const inputByMessageId = useRef<Map<Id, string>>(new Map());
  const idSeq = useRef(0);

  const nextId = useCallback(
    (suffix: string): Id => {
      idSeq.current += 1;
      return `msg-${threadId}-${Date.now()}-${idSeq.current}-${suffix}`;
    },
    [threadId],
  );

  const runStream = useCallback(
    async (agentMessageId: Id, input: string, history: Message[]) => {
      inputByMessageId.current.set(agentMessageId, input);
      setIsStreaming(true);
      setStreamingMessageId(agentMessageId);

      const {
        appendToken,
        addCitation,
        appendBlock,
        setStatusLine,
        setMessageError,
        setMessageStatus,
        setThreadStatus,
        upsertCard,
        startTask,
        taskStep,
        taskProgress,
        finishTask,
        failTask,
        cancelTask,
      } = useStore.getState();
      const ctx: AgentContext = { workspaceId: scope, threadId, history };

      // Пока идёт прогон — тред честно «Агент работает» (docs/DOMAIN.md §8).
      setThreadStatus(threadId, 'working');

      /** Получено ли терминальное событие (`done`/`error`) — иначе поток прерван `cancel()`. */
      let terminal = false;

      /**
       * Задача, объявленная `handoff`-событием этого прогона (docs/DOMAIN.md
       * §6, docs/SCENARIOS.md §3.3). `AgentTransport.send()` отдаёт один
       * непрерывный поток на реплику — после `handoff` тот же генератор
       * продолжает эмитить `status` (шаги/прогресс фоновой операции) и
       * заканчивается обычными `card`/`citation`/`done`. Другого способа
       * довести `BackgroundTask` до `succeeded` в доменной модели нет (см.
       * комментарий `core/agent/scenarios/casePosition.ts`), поэтому именно
       * здесь, в единственной точке встречи потока событий со стором,
       * `status`/`done`/`error` этого прогона зеркалятся в `tasksSlice`, пока
       * задача объявлена. Живёт только в рамках текущего `runStream` — это
       * деталь оркестрации одного прогона, не состояние хука.
       *
       * Обёрнута в объект (не голый `let`), потому что присваивание живёт в
       * замыкании `handleEvent`, вызываемом из `for await` внутри `try`: при
       * голом `let` TS сужает тип в блоке `finally` по последнему видимому
       * присваиванию в ЭТОЙ функции (`= null`), игнорируя присваивание внутри
       * вложенной функции, и ошибочно считает `handoffTask` типом `null`
       * литерально. Чтение через свойство объекта эту проблему не имеет.
       */
      const handoffTaskRef: { current: BackgroundTask | null } = { current: null };

      try {
        for await (const event of transport.send(input, ctx)) {
          handleEvent(event);
        }
      } finally {
        if (!terminal) {
          // Отменённый поток не эмитирует `done` (mockTransport.ts, комментарий
          // файла) — честно закрываем сообщение сами, а не оставляем его
          // вечно "streaming" с зависшим статус-баром.
          const state = useStore.getState();
          if (state.messages[agentMessageId]?.status === 'streaming') {
            state.setStatusLine(agentMessageId, undefined);
            state.setMessageStatus(agentMessageId, 'complete');
          }
          // Прогон оборван — тред больше не «работает».
          state.setThreadStatus(threadId, 'active');
          // Поток прерван `cancel()`, а не завершился штатным `done`/`error` —
          // объявленная фоновая задача (если была) тоже не доведена до конца:
          // честно помечаем её отменённой, а не оставляем «зависшей» в
          // состоянии `running` навсегда в BackgroundTaskTray.
          if (handoffTaskRef.current) cancelTask(handoffTaskRef.current.id);
        }
        setIsStreaming(false);
        setStreamingMessageId(null);
      }

      function handleEvent(event: AgentEvent): void {
        switch (event.t) {
          case 'status':
            setStatusLine(agentMessageId, {
              label: event.label,
              progress: event.progress,
              startedAt: new Date().toISOString(),
            });
            if (handoffTaskRef.current) {
              const activeTask = handoffTaskRef.current;
              // Метки шагов фоновой задачи совпадают с метками `status`-событий
              // после `handoff` (см. `casePosition.ts`, `BACKGROUND_STEP_LABELS`)
              // — так и находим, какой шаг сейчас активен.
              const stepIndex = activeTask.steps.findIndex((step) => step.label === event.label);
              if (stepIndex >= 0) taskStep(activeTask.id, stepIndex, event.label);
              if (event.progress) taskProgress(activeTask.id, event.progress.done, event.progress.total);
            }
            return;
          case 'token':
            appendToken(agentMessageId, event.text);
            return;
          case 'citation':
            addCitation(agentMessageId, event.ref);
            return;
          case 'block':
            appendBlock(agentMessageId, event.block);
            return;
          case 'clarify':
            appendBlock(agentMessageId, {
              type: 'clarify',
              question: event.question,
              options: event.options,
            });
            return;
          case 'card':
            // Кладём карточку в cards-слайс и связываем с сообщением через
            // card_ref-блок — дальше её рисует `CardRenderer` (единственная
            // точка рендера, см. `core/cards/CardRenderer`). Один и тот же
            // `id` может прийти повторно из другого сценария (комментарий
            // `scenarios/cards.ts`) — `upsertCard` мерджит, не дублирует.
            upsertCard(event.card);
            appendBlock(agentMessageId, { type: 'card_ref', cardId: event.card.id });
            return;
          case 'handoff':
            // Операция уходит в фон (docs/DOMAIN.md §6): кладём задачу в
            // tasksSlice — дальше её жизненный цикл ведёт этот же генератор
            // через `status` (обработано выше) и терминальный `done`/`error`
            // ниже. Тост с результатом и переход к нему — на стороне
            // `useBackgroundTask` (core/tasks): эта функция знает только о
            // потоке событий транспорта, не о том, как показать тост.
            handoffTaskRef.current = event.task;
            startTask(event.task);
            return;
          case 'error':
            setMessageError(agentMessageId, { message: event.message, retryable: event.retryable });
            setMessageStatus(agentMessageId, 'error');
            if (handoffTaskRef.current) failTask(handoffTaskRef.current.id, event.message);
            // Сорвавшийся прогон ждёт решения юриста — «Повторить» или новая реплика.
            setThreadStatus(threadId, 'awaiting_user');
            terminal = true;
            return;
          case 'done':
            setStatusLine(agentMessageId, undefined);
            setMessageStatus(agentMessageId, 'complete');
            if (handoffTaskRef.current) finishTask(handoffTaskRef.current.id, { kind: 'thread', id: threadId });
            setThreadStatus(threadId, needsUser(agentMessageId) ? 'awaiting_user' : 'active');
            terminal = true;
            return;
          default: {
            const exhaustive: never = event;
            void exhaustive;
          }
        }
      }

      /**
       * Требует ли ответ агента хода юриста: он либо задал уточняющий вопрос
       * (`clarify`), либо предложил карточку, которую надо подтвердить или
       * отклонить. Иначе тред просто «активен».
       */
      function needsUser(messageId: Id): boolean {
        const state = useStore.getState();
        const message = state.messages[messageId];
        if (!message) return false;
        return message.blocks.some(
          (block) =>
            block.type === 'clarify' ||
            (block.type === 'card_ref' && state.cards[block.cardId]?.state === 'pending'),
        );
      }
    },
    [threadId, scope, transport],
  );

  const sendUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const { appendMessage, renameThread, threads } = useStore.getState();

      // Тема треда — из первой реплики пользователя. Переименовываем только
      // безымянный тред («Новый разговор» из кнопки «+»): у дневного чата и у
      // тредов из сида названия осмысленные, их трогать нельзя.
      if (threads[threadId]?.title === NEW_THREAD_TITLE) {
        renameThread(threadId, threadTitleFromMessage(trimmed));
      }

      appendMessage({
        id: nextId('u'),
        threadId,
        role: 'user',
        blocks: [{ type: 'text', text: trimmed, citations: [] }],
        status: 'complete',
        createdAt: new Date().toISOString(),
      });

      // История для `ctx` — до появления самого placeholder-сообщения агента
      // (иначе пустое "streaming"-сообщение попало бы в свою же историю).
      // Реплика пользователя уже добавлена выше и в историю входит.
      const history = selectThreadMessages(useStore.getState(), threadId);

      const agentMessageId = nextId('a');
      appendMessage({
        id: agentMessageId,
        threadId,
        role: 'agent',
        blocks: [],
        status: 'streaming',
        createdAt: new Date().toISOString(),
      });

      void runStream(agentMessageId, trimmed, history);
    },
    [threadId, isStreaming, nextId, runStream],
  );

  const runTrigger = useCallback(
    (triggerText: string) => {
      if (isStreaming) return;
      const { appendMessage } = useStore.getState();
      const history = selectThreadMessages(useStore.getState(), threadId);

      const agentMessageId = nextId('a');
      appendMessage({
        id: agentMessageId,
        threadId,
        role: 'agent',
        blocks: [],
        status: 'streaming',
        createdAt: new Date().toISOString(),
      });
      void runStream(agentMessageId, triggerText, history);
    },
    [threadId, isStreaming, nextId, runStream],
  );

  const retry = useCallback(
    (failedMessageId: Id) => {
      if (isStreaming) return;
      const input = inputByMessageId.current.get(failedMessageId);
      if (!input) return;

      // Новое сообщение агента, а не сброс блоков старого: `threadsSlice`
      // не даёт способа очистить `blocks` задним числом (только дописывать),
      // а трогать стор ради нового примитива — вне границ этой задачи.
      // Старое сообщение с ошибкой остаётся в истории как есть (и как часть `history`).
      const { appendMessage } = useStore.getState();
      const history = selectThreadMessages(useStore.getState(), threadId);

      const agentMessageId = nextId('a');
      appendMessage({
        id: agentMessageId,
        threadId,
        role: 'agent',
        blocks: [],
        status: 'streaming',
        createdAt: new Date().toISOString(),
      });
      void runStream(agentMessageId, input, history);
    },
    [threadId, isStreaming, nextId, runStream],
  );

  const cancel = useCallback(() => {
    transport.cancel(threadId);
  }, [threadId, transport]);

  return { isStreaming, streamingMessageId, sendUserMessage, runTrigger, retry, cancel };
}
