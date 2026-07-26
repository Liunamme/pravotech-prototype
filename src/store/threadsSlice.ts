import type { StateCreator } from 'zustand';
import type {
  AgentStatus,
  Id,
  Message,
  MessageBlock,
  MessageStatus,
  SourceRef,
  Thread,
  ThreadStatus,
} from '@/types/domain';
import type { StoreState } from './index';

export type ThreadsSlice = {
  threads: Record<Id, Thread>;
  messages: Record<Id, Message>;
  /** Порядок сообщений внутри треда (createdAt asc) — сообщения хранятся плоско. */
  messageIdsByThread: Record<Id, Id[]>;

  createThread: (thread: Thread) => void;
  /**
   * Статус треда — живой: `useAgentStream` переводит его в `working` на время
   * прогона агента и в `active`/`awaiting_user` по его итогу (docs/DOMAIN.md §8).
   */
  setThreadStatus: (threadId: Id, status: ThreadStatus) => void;
  /** Тема треда из первой реплики пользователя (см. `threadTitleFromMessage`). */
  renameThread: (threadId: Id, title: string) => void;
  appendMessage: (message: Message) => void;
  /** Дописывает в последний text-блок сообщения, создаёт его при необходимости. */
  appendToken: (messageId: Id, text: string) => void;
  appendBlock: (messageId: Id, block: MessageBlock) => void;
  /** Добавляет ссылку в citations последнего text-блока сообщения. */
  addCitation: (messageId: Id, ref: SourceRef) => void;
  setMessageStatus: (messageId: Id, status: MessageStatus) => void;
  setStatusLine: (messageId: Id, statusLine: AgentStatus | undefined) => void;
  setMessageError: (messageId: Id, error: Message['error']) => void;

  hydrateThreads: (threads: Thread[]) => void;
  hydrateMessages: (messages: Message[]) => void;
};

export const createThreadsSlice: StateCreator<StoreState, [], [], ThreadsSlice> = (set) => ({
  threads: {},
  messages: {},
  messageIdsByThread: {},

  createThread: (thread) =>
    set((state) => ({
      threads: { ...state.threads, [thread.id]: thread },
      messageIdsByThread: {
        ...state.messageIdsByThread,
        [thread.id]: state.messageIdsByThread[thread.id] ?? [],
      },
    })),

  setThreadStatus: (threadId, status) =>
    set((state) => {
      const thread = state.threads[threadId];
      if (!thread || thread.status === status) return state;
      return { threads: { ...state.threads, [threadId]: { ...thread, status } } };
    }),

  renameThread: (threadId, title) =>
    set((state) => {
      const thread = state.threads[threadId];
      if (!thread || thread.title === title) return state;
      return { threads: { ...state.threads, [threadId]: { ...thread, title } } };
    }),

  appendMessage: (message) =>
    set((state) => {
      const ids = state.messageIdsByThread[message.threadId] ?? [];
      const thread = state.threads[message.threadId];
      return {
        messages: { ...state.messages, [message.id]: message },
        messageIdsByThread: {
          ...state.messageIdsByThread,
          [message.threadId]: [...ids, message.id],
        },
        threads: thread
          ? { ...state.threads, [message.threadId]: { ...thread, updatedAt: message.createdAt } }
          : state.threads,
      };
    }),

  appendToken: (messageId, text) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;

      const blocks = [...message.blocks];
      const lastIndex = blocks.length - 1;
      const last = lastIndex >= 0 ? blocks[lastIndex] : undefined;

      if (last && last.type === 'text') {
        blocks[lastIndex] = { ...last, text: last.text + text };
      } else {
        blocks.push({ type: 'text', text, citations: [] });
      }

      return { messages: { ...state.messages, [messageId]: { ...message, blocks } } };
    }),

  appendBlock: (messageId, block) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;
      return {
        messages: {
          ...state.messages,
          [messageId]: { ...message, blocks: [...message.blocks, block] },
        },
      };
    }),

  addCitation: (messageId, ref) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;

      const blocks = [...message.blocks];
      let lastTextIndex = -1;
      for (let i = blocks.length - 1; i >= 0; i -= 1) {
        if (blocks[i]?.type === 'text') {
          lastTextIndex = i;
          break;
        }
      }

      if (lastTextIndex === -1) {
        if (import.meta.env.DEV) {
          console.warn(
            `[threadsSlice] addCitation: в сообщении "${messageId}" нет text-блока — создаю пустой.`,
          );
        }
        blocks.push({ type: 'text', text: '', citations: [ref] });
      } else {
        const block = blocks[lastTextIndex];
        if (block && block.type === 'text') {
          blocks[lastTextIndex] = { ...block, citations: [...block.citations, ref] };
        }
      }

      return { messages: { ...state.messages, [messageId]: { ...message, blocks } } };
    }),

  setMessageStatus: (messageId, status) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;
      return { messages: { ...state.messages, [messageId]: { ...message, status } } };
    }),

  setStatusLine: (messageId, statusLine) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;
      return { messages: { ...state.messages, [messageId]: { ...message, statusLine } } };
    }),

  setMessageError: (messageId, error) =>
    set((state) => {
      const message = state.messages[messageId];
      if (!message) return state;
      return { messages: { ...state.messages, [messageId]: { ...message, error } } };
    }),

  hydrateThreads: (threads) =>
    set((state) => {
      const nextThreads = { ...state.threads };
      const nextIds = { ...state.messageIdsByThread };
      for (const thread of threads) {
        nextThreads[thread.id] = thread;
        if (!nextIds[thread.id]) nextIds[thread.id] = [];
      }
      return { threads: nextThreads, messageIdsByThread: nextIds };
    }),

  hydrateMessages: (messages) =>
    set((state) => {
      const nextMessages = { ...state.messages };
      for (const message of messages) nextMessages[message.id] = message;

      const nextIds = { ...state.messageIdsByThread };
      const affectedThreads = new Set(messages.map((m) => m.threadId));
      for (const threadId of affectedThreads) {
        nextIds[threadId] = Object.values(nextMessages)
          .filter((m) => m.threadId === threadId)
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
          .map((m) => m.id);
      }

      return { messages: nextMessages, messageIdsByThread: nextIds };
    }),
});
