# SPEC — единый контракт проекта ПравоТех

Этот файл — источник правды для всех исполнителей. Любой код в репозитории обязан ему соответствовать.
Если спека чего-то не покрывает — **не выдумывать**, а записать вопрос в `DEVLOG.md` → «Открытые вопросы».

---

## 1. Стек и базовая настройка

- Vite · React 18 · TypeScript **strict** · React Router 6 (**HashRouter**) · Zustand · CSS Modules · Radix UI · clsx · lucide-react · date-fns.
- Шрифты через `@fontsource-variable/inter` и `@fontsource-variable/source-serif-4` — **без внешних CDN** (работает офлайн и на GitHub Pages).
- `vite.config.ts`: `base: './'` — относительные пути к ассетам. В связке с `HashRouter` это даёт работоспособность на любом хостинге без правки конфига.
- `tsconfig`: `strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess`, алиас `@/*` → `src/*`.
- Никаких `any` в публичных сигнатурах. `unknown` + сужение — можно.

---

## 2. Структура файлов

```
src/
  app/
    App.tsx, router.tsx, providers.tsx
    ThemeProvider.tsx
  shared/
    ui/<Name>/<Name>.tsx + <Name>.module.css + index.ts
    lib/            cn.ts, date.ts, format.ts, useMediaQuery.ts, useLocalStorage.ts
    styles/         reset.css, tokens.css, shared.module.css
  core/
    layout/         AppShell, Rail, ResizablePanels, InspectorSlot
    chat/           ChatView, MessageList, StreamingText, CitationChip,
                    Composer, AgentStatusLine, SkillSuggestions
    cards/          CardQueue, ActionCardShell, CardRenderer, useCardDecision
    calendar/       DeadlineTimeline, MiniMonth, EventRow
    documents/      DocumentInspector, DocumentViewer, HighlightAnchor
    agent/          transport.ts, mockTransport.ts, scenarios/
    tasks/          BackgroundTaskTray, useBackgroundTask
  workspaces/
    types.ts, registry.ts
    obligations/    manifest.ts, cards/, tabs/, seed.ts
    litigation/     manifest.ts, cards/, tabs/, seed.ts
  store/            index.ts + слайсы
  pages/            TodayPage, WorkspacePage, SettingsPage, NotFoundPage
  types/            domain.ts (общие доменные типы)
```

**Инвариант:** `src/core/**` и `src/shared/**` не имеют права импортировать что-либо из `src/workspaces/<конкретное>`. Только из `src/workspaces/types.ts` и `registry.ts`.

---

## 3. Токены — `src/shared/styles/tokens.css`

Задаются на `:root` (светлая) и переопределяются в `[data-theme='dark']`.
**Только эти имена.** Расширять можно, переименовывать — нет.

### Поверхности
| Токен | Light | Dark |
|---|---|---|
| `--color-canvas` | `#EEF2F6` | `#0B0F14` |
| `--color-surface` | `#FFFFFF` | `#141A21` |
| `--color-surface-raised` | `#FFFFFF` | `#1B222B` |
| `--color-surface-sunken` | `#F4F7FA` | `#0F141A` |
| `--color-surface-hover` | `#F1F5F9` | `#1E262F` |
| `--color-surface-active` | `#E6EDF4` | `#25303B` |
| `--color-surface-selected` | `#E8EFFB` | `#1A2536` |

### Текст
| Токен | Light | Dark |
|---|---|---|
| `--color-text` | `#0F172A` | `#E6EDF3` |
| `--color-text-secondary` | `#475569` | `#A9B6C3` |
| `--color-text-muted` | `#64748B` | `#7D8B9A` |
| `--color-text-inverted` | `#FFFFFF` | `#0B0F14` |

### Границы
| Токен | Light | Dark |
|---|---|---|
| `--color-border` | `#D8E0E8` | `#232C36` |
| `--color-border-strong` | `#B9C5D2` | `#33404D` |
| `--color-border-subtle` | `#E8EDF2` | `#1A222B` |

### Акцент (первичное действие)
| Токен | Light | Dark |
|---|---|---|
| `--color-accent` | `#1E3A8A` | `#5B8DEF` |
| `--color-accent-hover` | `#1A3378` | `#78A2F5` |
| `--color-accent-active` | `#152A63` | `#4A7BD8` |
| `--color-accent-fg` | `#FFFFFF` | `#0B0F14` |
| `--color-accent-subtle` | `#E8EFFB` | `#16233A` |
| `--color-accent-border` | `#BBD0F0` | `#2A3F63` |

### Статусы
Каждый — четвёркой `X`, `X-fg`, `X-subtle`, `X-border`.

| Роль | Light base | Dark base |
|---|---|---|
| `--color-danger` | `#DC2626` | `#F87171` |
| `--color-warning` | `#B45309` | `#F0A54A` |
| `--color-success` | `#15803D` | `#4ADE80` |
| `--color-info` | `#1E40AF` | `#7DA5F7` |

`-fg` — контрастный текст на заливке (light: `#FFFFFF`, dark: `#0B0F14`).
`-subtle` — светлая/тёмная подложка под бейдж. `-border` — рамка бейджа.

### Приоритеты P0–P3
Отдельные токены, **не переиспользовать статусные напрямую** — приоритет и статус меняются независимо.

| Токен | Light | Dark | Визуал |
|---|---|---|---|
| `--color-p0` | `#DC2626` | `#F87171` | заливка + белый текст |
| `--color-p1` | `#B45309` | `#F0A54A` | подложка `-subtle` + рамка |
| `--color-p2` | `#1E40AF` | `#7DA5F7` | подложка `-subtle` + рамка |
| `--color-p3` | `#64748B` | `#7D8B9A` | только рамка, без заливки |

Плюс `-subtle` и `-border` для каждого.
**Правило:** приоритет всегда кодируется цветом **и** текстовой меткой (`P0`…`P3`) **и** плотностью заливки. Цвет один — никогда.

> Конкретные значения `-subtle` / `-border` для статусов и приоритетов зафиксированы в `src/shared/styles/tokens.css` (этап 1) и являются каноничными. Не пересматривать.

### Фокус
`--color-focus-ring`: light `#1E3A8A`, dark `#5B8DEF`.
`--focus-ring: 0 0 0 2px var(--color-canvas), 0 0 0 4px var(--color-focus-ring);`

### Отступы (плотность 8/10)
`--space-1: 4px` · `2: 8px` · `3: 12px` · `4: 16px` · `5: 20px` · `6: 24px` · `8: 32px` · `10: 40px` · `12: 48px`

### Радиусы
`--radius-sm: 4px` · `md: 6px` · `lg: 8px` · `xl: 12px` · `full: 999px`

### Типографика
```
--font-ui: 'Inter Variable', system-ui, -apple-system, sans-serif;
--font-serif: 'Source Serif 4 Variable', Georgia, serif;   /* только просмотрщик документов */
--font-mono: ui-monospace, 'SF Mono', Menlo, monospace;

--text-xs: 11px · --text-sm: 12px · --text-base: 13px · --text-md: 14px
--text-lg: 15px  /* тело чата */ · --text-xl: 17px · --text-2xl: 20px · --text-3xl: 24px

--leading-tight: 1.25 · --leading-normal: 1.45 · --leading-relaxed: 1.6
--weight-regular: 400 · --weight-medium: 500 · --weight-semibold: 600 · --weight-bold: 700
```
Базовый размер интерфейса — `--text-base` (13px). Тело сообщений чата — `--text-lg` (15px) / `--leading-relaxed`.
Даты, суммы, счётчики, таймеры — `font-variant-numeric: tabular-nums`.

### Тени
```
--shadow-sm:      0 1px 2px rgba(15,23,42,.06);
--shadow-md:      0 2px 8px rgba(15,23,42,.08);
--shadow-lg:      0 8px 24px rgba(15,23,42,.12);
--shadow-overlay: 0 16px 48px rgba(15,23,42,.18);
```
В тёмной теме — те же радиусы размытия, но `rgba(0,0,0,.4/.5/.6)`.

### Движение
```
--duration-fast: 120ms · --duration-base: 180ms · --duration-slow: 260ms
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```
Анимировать **только** `transform` и `opacity`. Вход — `--ease-out`, выход — `--ease-in` и короче (~70%).

### Раскладка
```
--rail-width: 56px · --header-height: 48px · --row-height: 34px
--panel-min-width: 260px · --inspector-width: 520px
--z-base: 0 · --z-sticky: 10 · --z-panel: 20 · --z-overlay: 40
--z-dialog: 50 · --z-toast: 60 · --z-tooltip: 70
```

---

## 4. Конвенции кода

### CSS Modules
1. **Ни одного literal-цвета и literal-отступа** в `*.module.css`. Только `var(--...)`. Исключение: `1px` для hairline-границ.
2. Варианты — через map, не через каскад:
   ```tsx
   className={cn(s.root, s[`variant_${variant}`], s[`size_${size}`], isActive && s.active)}
   ```
   Классы в CSS называются ровно `.variant_primary`, `.size_sm`, `.active`.
3. `composes:` — только из `shared.module.css` и только для `focusRing`, `truncate`, `scrollArea`, `visuallyHidden`.
4. Модуль лежит рядом с компонентом. Глобальные стили — только `reset.css` и `tokens.css`.
5. Адаптив внутри компонента — `@container`, не `@media`. Медиа-запросы допустимы только в `core/layout/**`.

### React / TS
1. Именованные экспорты. `index.ts` реэкспортит из папки компонента.
2. `type` для объектов, `interface` — для расширяемых контрактов (манифесты, транспорт).
3. Ключи списков — стабильные `id`, никогда индекс.
4. Все icon-only кнопки — с `aria-label`.
5. Никаких эмодзи в UI. Иконки — только `lucide-react`.
6. Форматирование дат — через `src/shared/lib/date.ts` с локалью `ru`. Прямые вызовы `date-fns` в компонентах запрещены.

### a11y (обязательный минимум)
- Видимое фокус-кольцо через `composes: focusRing`. Убирать `outline` без замены запрещено.
- Стриминг ответа — контейнер с `aria-live="polite"`.
- Модалки/слайд-оверы — Radix (фокус-трап и `Esc` из коробки).
- Все интерактивные цели ≥ 32×32px в плотном интерфейсе, ≥ 44×44px в тач-раскладке.
- Уважать `prefers-reduced-motion: reduce` — глобальным правилом в `reset.css`, отключающим декоративные переходы.

---

## 5. Что считается «готово» для этапа

- `npx tsc --noEmit` — чисто.
- `npm run build` — успешно.
- Обе темы визуально проверены.
- Нет literal-цветов вне `tokens.css`.
- Обновлён `DEVLOG.md`: таблица прогресса + запись в «Хронику» (что сделано, что отложено, какие решения приняты).
