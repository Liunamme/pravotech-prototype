# DOMAIN — доменная модель ПравоТех

Контракт типов. Реализуется на этапе 3 в `src/types/domain.ts`, `src/workspaces/types.ts`, `src/core/agent/transport.ts`.
Все последующие этапы опираются на эти сигнатуры. Менять их можно, но только через правку этого файла + запись в DEVLOG.

---

## 1. Базовое

```ts
export type Id = string;
export type IsoDateTime = string;          // '2026-07-24T09:15:00+03:00'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
```

Приоритет **считает платформа** (по ТЗ), интерфейс только отображает. В моке он приходит готовым в сид-данных и в событиях агента — UI никогда его не вычисляет.

---

## 2. Источники и документы

Центральное требование ТЗ: «каждый вывод агента ссылается на источник, источник кликабелен: открывает документ в нужном месте».

```ts
export type DocumentKind = 'contract' | 'court_filing' | 'correspondence' | 'ruling' | 'internal';

export type DocAnchor = {
  id: Id;                  // стабильный якорь, попадает в URL: ?doc=..&anchor=..
  label: string;           // 'п. 7.2', 'абз. 3 ст. 4', 'лист 12'
  blockId: Id;             // на какой блок документа указывает
  charStart?: number;      // подсветка внутри блока; если нет — подсвечивается блок целиком
  charEnd?: number;
};

export type DocBlock =
  | { id: Id; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: Id; type: 'clause'; number: string; text: string }   // number: '7.2'
  | { id: Id; type: 'paragraph'; text: string }
  | { id: Id; type: 'table'; rows: string[][]; head?: string[] };

export type LegalDocument = {
  id: Id;
  workspaceId: Id;
  kind: DocumentKind;
  title: string;                 // 'Договор аренды №44-АР от 12.03.2024'
  parties?: string[];
  signedAt?: IsoDateTime;
  blocks: DocBlock[];
  anchors: DocAnchor[];
  meta?: Record<string, string>; // отображается в шапке инспектора
};

/** Ссылка агента на источник. Живёт в сообщениях и в карточках. */
export type SourceRef = {
  id: Id;
  docId: Id;
  anchorId: Id;
  label: string;    // как показать в чипе: 'Договор №44-АР, п. 7.2'
  quote: string;    // точная цитата — показывается в тултипе до открытия документа
};
```

**Инвариант:** `SourceRef.anchorId` обязан существовать в `LegalDocument.anchors`. Сид-данные проверяются dev-ассертом при инициализации стора — битая ссылка должна падать громко, а не молча.

---

## 3. Чат

Чат — «разговор-задача». Владеет **только разговором**; документы и очередь карточек принадлежат пространству.

```ts
export type ThreadStatus = 'active' | 'awaiting_user' | 'working' | 'done';

export type Thread = {
  id: Id;
  workspaceId: Id | 'today';     // 'today' — дневной чат уровня 1
  title: string;
  status: ThreadStatus;
  subjectRef?: { kind: 'contract' | 'case'; id: Id; label: string }; // к чему привязан разговор
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  unread: boolean;
};

export type MessageBlock =
  | { type: 'text'; text: string; citations: SourceRef[] }
  | { type: 'card_ref'; cardId: Id }              // карточка, предложенная в этом сообщении
  | { type: 'doc_ref'; docId: Id; anchorId?: Id } // превью документа
  | { type: 'table'; head: string[]; rows: string[][]; citations: SourceRef[] }
  | { type: 'clarify'; question: string; options: string[] };

export type MessageStatus = 'streaming' | 'complete' | 'error';

export type Message = {
  id: Id;
  threadId: Id;
  role: 'user' | 'agent' | 'system';
  blocks: MessageBlock[];
  status: MessageStatus;
  statusLine?: AgentStatus;   // живая строка статуса, пока status === 'streaming'
  error?: { message: string; retryable: boolean };
  createdAt: IsoDateTime;
};

export type AgentStatus = {
  label: string;                                  // 'Читаю договоры'
  progress?: { done: number; total: number };     // '7 из 12' + полоса
  startedAt: IsoDateTime;
};
```

**Правило:** блок `text` без `citations` допустим только для `role: 'system'` и для приветственных/служебных реплик агента. Содержательное утверждение обязано иметь источник.

---

## 4. Карточка действия

Главный механизм контроля. Одна и та же карточка живёт и в очереди «Сегодня», и в своём пространстве — это одна сущность с одним `id`, а не две копии.

```ts
export type CardState =
  | 'pending'     // ждёт решения юриста
  | 'accepted'    // подтверждена, поставлена в исполнение
  | 'modified'    // подтверждена с правками
  | 'rejected'
  | 'executing'   // исполняется (см. BackgroundTask)
  | 'done'
  | 'failed';

export type ActionCard<P = unknown> = {
  id: Id;
  workspaceId: Id;
  type: string;                 // ключ в CardTypeDef реестра пространства
  priority: Priority;           // посчитан платформой
  title: string;
  summary: string;              // одна строка: что предлагается и почему
  payload: P;                   // типизирован конкретным CardTypeDef
  sources: SourceRef[];         // обоснование предложения
  subjectRef?: { kind: 'contract' | 'case'; id: Id; label: string };
  originThreadId?: Id;          // где агент это предложил → «Показать в чате»
  dueAt?: IsoDateTime;          // срок, к которому надо решить
  createdAt: IsoDateTime;
  state: CardState;
  decidedAt?: IsoDateTime;
  modifiedPayload?: P;          // если state === 'modified' — для diff
  failure?: { message: string; retryable: boolean };
};
```

### Diff при «изменить»
`ActionCardShell` сравнивает `payload` и `modifiedPayload` по верхнеуровневым ключам и подсвечивает изменённые поля. Утилита `diffPayload(original, modified): Set<string>` живёт в `core/cards/`.

---

## 5. Календарь

```ts
export type EventKind = 'deadline' | 'hearing' | 'meeting' | 'reminder';

export type CalendarEvent = {
  id: Id;
  workspaceId: Id;
  kind: EventKind;
  title: string;
  at: IsoDateTime;
  durationMin?: number;
  location?: string;
  priority?: Priority;          // срок может быть критичным
  subjectRef?: { kind: 'contract' | 'case'; id: Id; label: string };
  relatedCardId?: Id;           // событие, порождённое карточкой
  sources?: SourceRef[];        // откуда взялся срок — тоже кликабельно
};
```

Срок без источника — подозрителен. Для `kind: 'deadline'` поле `sources` фактически обязательно.

---

## 6. Фоновые задачи

Ответ на требование «долгие операции показываются честно».

```ts
export type TaskState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type BackgroundTask = {
  id: Id;
  workspaceId: Id;
  title: string;                // 'Анализ портфеля договоров'
  state: TaskState;
  steps: { label: string; state: 'pending' | 'active' | 'done' | 'failed' }[];
  progress?: { done: number; total: number };
  startedAt: IsoDateTime;
  finishedAt?: IsoDateTime;
  resultRef?: { kind: 'thread' | 'card' | 'document'; id: Id };  // куда вести по клику
  error?: string;
};

export type TaskEvent =
  | { t: 'step'; index: number; label: string }
  | { t: 'progress'; done: number; total: number }
  | { t: 'succeeded'; resultRef?: BackgroundTask['resultRef'] }
  | { t: 'failed'; message: string };
```

**Три класса ожидания** (реализуются на этапах 4–5):
| Длительность | Поведение |
|---|---|
| < 300 ms | без индикатора |
| 0.3–3 s | скелетон / статусная строка в потоке чата |
| > 3 s | уезжает в `BackgroundTaskTray` в рейке, юрист свободен, по завершении — тост со ссылкой |

---

## 7. Транспорт агента

Ключ к подменяемости: UI знает только этот интерфейс.

```ts
export type AgentEvent =
  | { t: 'status'; label: string; progress?: { done: number; total: number } }
  | { t: 'token'; text: string }
  | { t: 'citation'; ref: SourceRef }
  | { t: 'block'; block: MessageBlock }     // готовый блок целиком (таблица, превью)
  | { t: 'card'; card: ActionCard }
  | { t: 'clarify'; question: string; options: string[] }
  | { t: 'handoff'; task: BackgroundTask }  // операция уходит в фон
  | { t: 'error'; message: string; retryable: boolean }
  | { t: 'done' };

export type AgentContext = {
  workspaceId: Id | 'today';
  threadId: Id;
  history: Message[];
};

export interface AgentTransport {
  send(input: string, ctx: AgentContext): AsyncIterable<AgentEvent>;
  cancel(threadId: Id): void;
}
```

`MockAgentTransport` реализует его поверх сценариев. Замена на SSE — новая реализация того же интерфейса и одна строка в провайдере. Никакой компонент не импортирует `mockTransport` напрямую — только через контекст.

---

## 8. Манифест рабочего пространства

Точка расширения платформы. **Новое пространство = один манифест + сид, ноль правок в ядре.**

```ts
export type AgentSkill = {
  id: Id;
  label: string;        // 'Найти автопролонгации'
  prompt: string;       // подставляется в композер
  icon?: LucideIcon;
};

export type ContextTabDef = {
  id: string;
  label: string;                     // 'Договоры', 'Дела', 'События'
  icon: LucideIcon;
  Component: FC<{ workspaceId: Id }>;
};

export interface CardTypeDef<P = unknown> {
  type: string;
  label: string;                     // 'Уведомление об отказе от пролонгации'
  icon: LucideIcon;
  /** Read-режим тела карточки. Хромировку рисует ActionCardShell. */
  Body: FC<{ payload: P; card: ActionCard<P> }>;
  /** Форма режима «изменить». Нет формы — кнопка «Изменить» скрыта. */
  EditForm?: FC<{ payload: P; onChange: (next: P) => void }>;
  /** Подпись основной кнопки. По умолчанию 'Подтвердить'. */
  confirmLabel?: string;
  /** true → confirm-диалог вместо undo-тоста (необратимые действия). */
  destructive?: boolean;
  /** Что происходит после подтверждения. Мок отдаёт поток событий задачи. */
  execute: (payload: P, card: ActionCard<P>) => AsyncIterable<TaskEvent>;
}

export interface WorkspaceManifest {
  id: Id;
  title: string;
  shortTitle: string;               // для рейки
  icon: LucideIcon;
  description: string;              // для пустых состояний и настроек
  contextTabs: ContextTabDef[];
  cardTypes: CardTypeDef<any>[];    // единственное допустимое any — гетерогенный реестр
  skills: AgentSkill[];
  seed: WorkspaceSeed;
}

export type WorkspaceSeed = {
  documents: LegalDocument[];
  cards: ActionCard[];
  events: CalendarEvent[];
  threads: Thread[];
  messages: Message[];
};
```

Реестр:
```ts
// src/workspaces/registry.ts
export const workspaces: WorkspaceManifest[] = [obligationsManifest, litigationManifest];
export const getWorkspace = (id: Id): WorkspaceManifest | undefined => ...;
export const getCardType = (workspaceId: Id, type: string): CardTypeDef | undefined => ...;
```

**Решение (этап 3, зафиксировано):** пространства подключаются **литеральным массивом** в `registry.ts`, а не сам**регистрацией через побочный эффект импорта. Самрегистрация зависит от порядка импортов, ломает tree-shaking и делает поведение невоспроизводимым в тестах. Функция `registerWorkspace` остаётся в API, но только для тестов и дев-экспериментов — в продуктовом пути она не вызывается.

**Решение (этап 3, зафиксировано):** тема **не входит** в `uiSlice`. Она живёт в `ThemeProvider` (localStorage + `prefers-color-scheme`), потому что должна примениться к `<html>` до первого рендера — стор для этого слишком поздно инициализируется. Раздел 9 ниже исправлен.

**Решение (этап 3, зафиксировано):** каноничные имена гидраторов — по одному на слайс:
`hydrateDocuments`, `hydrateThreads`, `hydrateMessages`, `hydrateCards`, `hydrateEvents`.

---

## 9. Стор (Zustand)

Слайсы в `src/store/`. Плоские нормализованные записи `Record<Id, T>` + производные селекторы.

```
threadsSlice    threads, messages, активный тред, appendToken/appendBlock/setStatus
cardsSlice      cards, decide(id, outcome, modifiedPayload?), undo(id), bulkAcceptP3()
documentsSlice  documents (из сидов всех пространств)
eventsSlice     events
tasksSlice      tasks, start/step/progress/finish
uiSlice         инспектор { docId, anchorId } | null, фокус карточки, активный сегмент
                (тема — НЕ здесь, см. решение выше; ширины панелей — в ResizablePanels/localStorage)
```

**Ключевые селекторы:**
- `selectTodayQueue(state)` — карточки всех пространств в состоянии `pending`, сортировка: приоритет ↑, затем `dueAt` ↑, затем `createdAt` ↓. Это и есть «очередь со всех рабочих пространств».
- `selectWorkspaceQueue(state, workspaceId)` — то же с фильтром.
- `selectUpcoming(state, days = 14)` — события, отсортированные по `at`, сгруппированные по дню.
- `selectThreadMessages(state, threadId)`.

**Инвариант:** обе очереди читают из одного `cards`-слайса. Решение по карточке в «Сегодня» немедленно отражается в пространстве, потому что это одна запись.
