/**
 * Доменная модель ПравоТех.
 *
 * Источник правды — `docs/DOMAIN.md`. Менять сигнатуры можно только
 * синхронно с этим документом и записью в DEVLOG.
 *
 * Файл намеренно не зависит от React и от библиотек UI: доменные типы
 * должны быть переиспользуемы и в сторе, и в моке агента, и в будущем
 * реальном транспорте.
 */

export type Id = string;

/** ISO-8601 с таймзоной, например '2026-07-24T09:15:00+03:00'. */
export type IsoDateTime = string;

/**
 * Приоритет считает платформа, интерфейс его только отображает (требование ТЗ).
 * UI никогда не вычисляет это значение — оно приходит готовым.
 */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export const PRIORITIES: readonly Priority[] = ['P0', 'P1', 'P2', 'P3'] as const;

/** На что ссылается разговор, карточка или событие. */
export type SubjectRef = {
  kind: 'contract' | 'case';
  id: Id;
  label: string;
};

/* ─────────────────────────────  Документы и источники  ───────────────────────────── */

export type DocumentKind =
  | 'contract'
  | 'court_filing'
  | 'correspondence'
  | 'ruling'
  | 'internal';

/**
 * Якорь — адресуемое место внутри документа. Попадает в URL (`?doc=..&anchor=..`),
 * поэтому идентификаторы должны быть стабильными между перезапусками.
 */
export type DocAnchor = {
  id: Id;
  /** Как называть место в интерфейсе: 'п. 7.2', 'абз. 3 ст. 4', 'лист 12'. */
  label: string;
  blockId: Id;
  /** Подсветка внутри блока. Если не задана — подсвечивается блок целиком. */
  charStart?: number;
  charEnd?: number;
};

export type DocBlock =
  | { id: Id; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: Id; type: 'clause'; number: string; text: string }
  | { id: Id; type: 'paragraph'; text: string }
  | { id: Id; type: 'table'; head?: string[]; rows: string[][] };

export type LegalDocument = {
  id: Id;
  workspaceId: Id;
  kind: DocumentKind;
  title: string;
  parties?: string[];
  signedAt?: IsoDateTime;
  blocks: DocBlock[];
  anchors: DocAnchor[];
  /** Пары «поле → значение» для шапки инспектора. */
  meta?: Record<string, string>;
};

/**
 * Ссылка агента на источник.
 *
 * Ключевое требование ТЗ: каждый вывод агента ссылается на источник,
 * и источник кликабелен — открывает документ в нужном месте.
 */
export type SourceRef = {
  id: Id;
  docId: Id;
  anchorId: Id;
  /** Подпись чипа: 'Договор №44-АР, п. 7.2'. */
  label: string;
  /** Точная цитата — показывается в тултипе до открытия документа. */
  quote: string;
};

/* ─────────────────────────────────────  Чат  ────────────────────────────────────── */

export type ThreadStatus = 'active' | 'awaiting_user' | 'working' | 'done';

/** Идентификатор дневного чата уровня 1 («Сегодня»). */
export const TODAY_SCOPE = 'today' as const;
export type ThreadScope = Id | typeof TODAY_SCOPE;

/** Чат — это разговор-задача. Владеет только разговором. */
export type Thread = {
  id: Id;
  workspaceId: ThreadScope;
  title: string;
  status: ThreadStatus;
  subjectRef?: SubjectRef;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  unread: boolean;
};

export type MessageBlock =
  | { type: 'text'; text: string; citations: SourceRef[] }
  | { type: 'card_ref'; cardId: Id }
  | { type: 'doc_ref'; docId: Id; anchorId?: Id }
  | { type: 'table'; head: string[]; rows: string[][]; citations: SourceRef[] }
  | { type: 'clarify'; question: string; options: string[] };

export type MessageStatus = 'streaming' | 'complete' | 'error';

/** Живая строка статуса длинной операции. Честнее бесконечного спиннера. */
export type AgentStatus = {
  label: string;
  progress?: { done: number; total: number };
  startedAt: IsoDateTime;
};

export type Message = {
  id: Id;
  threadId: Id;
  role: 'user' | 'agent' | 'system';
  blocks: MessageBlock[];
  status: MessageStatus;
  /** Заполнена, пока `status === 'streaming'`. */
  statusLine?: AgentStatus;
  error?: { message: string; retryable: boolean };
  createdAt: IsoDateTime;
};

/* ────────────────────────────────  Карточки действий  ───────────────────────────── */

export type CardState =
  | 'pending'
  | 'accepted'
  | 'modified'
  | 'rejected'
  | 'executing'
  | 'done'
  | 'failed';

/** Исход решения юриста по карточке. */
export type CardDecision = 'accept' | 'modify' | 'reject';

/**
 * Главный механизм контроля: агент предлагает, юрист решает.
 *
 * Одна и та же карточка живёт и в очереди «Сегодня», и в своём пространстве —
 * это одна запись с одним `id`, а не две копии.
 */
export type ActionCard<P = unknown> = {
  id: Id;
  workspaceId: Id;
  /** Ключ типа в реестре карточек пространства. */
  type: string;
  priority: Priority;
  title: string;
  /** Одна строка: что предлагается и почему. */
  summary: string;
  payload: P;
  /** Обоснование предложения. Пустой массив — повод усомниться в данных. */
  sources: SourceRef[];
  subjectRef?: SubjectRef;
  /** Где агент это предложил — для перехода «Показать в чате». */
  originThreadId?: Id;
  /** Срок, к которому нужно принять решение. */
  dueAt?: IsoDateTime;
  createdAt: IsoDateTime;
  state: CardState;
  decidedAt?: IsoDateTime;
  /** Заполнен при `state === 'modified'` — основа для diff-подсветки. */
  modifiedPayload?: P;
  failure?: { message: string; retryable: boolean };
};

/* ───────────────────────────────────  Календарь  ────────────────────────────────── */

export type EventKind = 'deadline' | 'hearing' | 'meeting' | 'reminder';

export type CalendarEvent = {
  id: Id;
  workspaceId: Id;
  kind: EventKind;
  title: string;
  at: IsoDateTime;
  durationMin?: number;
  location?: string;
  priority?: Priority;
  subjectRef?: SubjectRef;
  /** Событие, порождённое подтверждённой карточкой. */
  relatedCardId?: Id;
  /** Откуда взялся срок. Для `kind: 'deadline'` фактически обязательно. */
  sources?: SourceRef[];
};

/* ────────────────────────────────  Фоновые задачи  ──────────────────────────────── */

export type TaskState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type TaskStep = {
  label: string;
  state: 'pending' | 'active' | 'done' | 'failed';
};

export type TaskResultRef = {
  kind: 'thread' | 'card' | 'document';
  id: Id;
};

/**
 * Латентность агента — реальность: долгие операции показываются честно.
 * Операции дольше ~3s уезжают сюда и не держат интерфейс.
 */
export type BackgroundTask = {
  id: Id;
  workspaceId: Id;
  title: string;
  state: TaskState;
  steps: TaskStep[];
  progress?: { done: number; total: number };
  startedAt: IsoDateTime;
  finishedAt?: IsoDateTime;
  resultRef?: TaskResultRef;
  error?: string;
};

/** События исполнения карточки после подтверждения. */
export type TaskEvent =
  | { t: 'step'; index: number; label: string }
  | { t: 'progress'; done: number; total: number }
  | { t: 'succeeded'; resultRef?: TaskResultRef }
  | { t: 'failed'; message: string };

/* ────────────────────────────────  Транспорт агента  ────────────────────────────── */

/**
 * Поток событий агента. UI знает только этот словарь — благодаря чему
 * мок заменяется на реальный SSE-транспорт без правок компонентов.
 */
export type AgentEvent =
  | { t: 'status'; label: string; progress?: { done: number; total: number } }
  | { t: 'token'; text: string }
  | { t: 'citation'; ref: SourceRef }
  | { t: 'block'; block: MessageBlock }
  | { t: 'card'; card: ActionCard }
  | { t: 'clarify'; question: string; options: string[] }
  | { t: 'handoff'; task: BackgroundTask }
  | { t: 'error'; message: string; retryable: boolean }
  | { t: 'done' };

export type AgentContext = {
  workspaceId: ThreadScope;
  threadId: Id;
  history: Message[];
};

export interface AgentTransport {
  send(input: string, ctx: AgentContext): AsyncIterable<AgentEvent>;
  cancel(threadId: Id): void;
}
