/**
 * Dry-run самопроверка мок-агента этапа 4a (docs/SCENARIOS.md).
 *
 * Не тест-раннер и не участвует в `npm run build` — отдельный ручной
 * скрипт, который быстро прогоняет весь мок и проверяет то, что модульные
 * тесты этапа не покрывают:
 *
 *   1. все семь сценариев реально доходят до `done`/`error` как честные
 *      асинхронные генераторы (не зависают, не бросают исключение);
 *   2. `tokenize(text).join('') === text` для каждого текста `content.ts`
 *      (инвариант, на котором держится потоковый вывод, §5.4);
 *   3. `AgentTransport.cancel()` реально прерывает поток на середине, а не
 *      просто перестаёт слушать уже досчитанный результат;
 *   4. каждый `SourceRef`, который эмитят сценарии (`citation`, `card`,
 *      таблицы), — это ровно то, что возвращают фабрики `refs.ts`, а не
 *      литерал с опечаткой в `id`/`docId`/`anchorId`.
 *
 * Запуск: `npm run dry-run`.
 *
 * `VITE_AGENT_SPEED` выставляется здесь, ДО первого `import()` агентского
 * кода — обычный (статический) `import` был бы поднят выше любого кода в
 * модуле и увидел бы `timing.ts` уже проинициализированным со старым
 * значением. Поэтому весь код, зависящий от таймингов, подключается через
 * динамический `import()` внутри `main()`.
 */

process.env['VITE_AGENT_SPEED'] ??= '20';

import assert from 'node:assert/strict';
import type { AgentContext, AgentEvent, AgentTransport, Id, SourceRef } from '@/types/domain';

type ContentModule = typeof import('../src/core/agent/scenarios/content.ts');
type RefsModule = typeof import('../src/core/agent/scenarios/refs.ts');
type ScenariosModule = typeof import('../src/core/agent/scenarios/index.ts');

function makeCtx(threadId: Id, workspaceId: AgentContext['workspaceId'] = 'obligations'): AgentContext {
  return { workspaceId, threadId, history: [] };
}

async function collectEvents(stream: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

function summarizeEvents(events: AgentEvent[]): string {
  const counts = new Map<AgentEvent['t'], number>();
  for (const event of events) {
    counts.set(event.t, (counts.get(event.t) ?? 0) + 1);
  }
  return [...counts.entries()].map(([t, n]) => `${t}×${n}`).join(', ');
}

/** Первые ~70 символов итогового текста ответа — для беглой проверки читаемости. */
function previewText(events: AgentEvent[]): string {
  const text = events
    .filter((e): e is Extract<AgentEvent, { t: 'token' }> => e.t === 'token')
    .map((e) => e.text)
    .join('');
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > 70 ? `${oneLine.slice(0, 70)}…` : oneLine;
}

function refsFromEvents(events: AgentEvent[]): SourceRef[] {
  const refs: SourceRef[] = [];
  for (const event of events) {
    if (event.t === 'citation') refs.push(event.ref);
    if (event.t === 'block' && event.block.type === 'table') refs.push(...event.block.citations);
    if (event.t === 'card') refs.push(...event.card.sources);
  }
  return refs;
}

/* ─────────────────────────────  1. tokenize round-trip  ─────────────────────────────── */

async function checkTokenizeRoundtrip(
  tokenize: (text: string) => string[],
  content: ContentModule,
): Promise<void> {
  const day = '1 сентября';
  const texts: Record<string, string> = {
    autoRenewalScanIntro: content.autoRenewalScanIntro(),
    autoRenewalScanOutro: content.autoRenewalScanOutro(),
    casePositionCourtesyNote: content.casePositionCourtesyNote(),
    casePositionResult: content.casePositionResult({ hearingDay: day }),
    priceIncreaseRefusalResult: content.priceIncreaseRefusalResult({ priceDay: day }),
    clarifyQuestion: content.clarifyQuestion(),
    failureErrorMessage: content.failureErrorMessage(),
    failureRetrySuccess: content.failureRetrySuccess(),
    fallbackWithContext: content.fallbackWithContext('тестовая тема'),
    fallbackGeneric: content.fallbackGeneric('Тестовое пространство'),
  };
  content
    .morningDigestSegments({ leaseNoticeDay: day, hearingDay: day, responseDay: day, priceDay: day })
    .forEach((segment, i) => {
      texts[`morningDigestSegments[${i}]`] = segment;
    });
  for (const option of content.clarifyOptions) {
    texts[`clarifyOptions:${option}`] = option;
  }

  let checked = 0;
  for (const [name, text] of Object.entries(texts)) {
    const roundtrip = tokenize(text).join('');
    assert.equal(roundtrip, text, `tokenize(text).join('') !== text для "${name}"`);
    checked += 1;
  }
  console.log(`[1/4] tokenize round-trip: OK (${checked} текстов из content.ts)`);
}

/* ───────────────────────────  2. канон источников из refs.ts  ───────────────────────── */

function buildCanon(refs: RefsModule): {
  refIds: Set<string>;
  docIds: Set<string>;
  anchorIds: Set<string>;
} {
  const docIds = new Set<string>(Object.values(refs.DOC));
  const anchorIds = new Set<string>(Object.values(refs.ANCHOR));
  const refIds = new Set<string>();

  let factoriesChecked = 0;
  for (const [key, value] of Object.entries(refs)) {
    if (!key.startsWith('src') || typeof value !== 'function') continue;
    const ref = (value as () => SourceRef)();
    assert.ok(docIds.has(ref.docId), `refs.ts: ${key}() ссылается на неизвестный docId "${ref.docId}"`);
    assert.ok(anchorIds.has(ref.anchorId), `refs.ts: ${key}() ссылается на неизвестный anchorId "${ref.anchorId}"`);
    refIds.add(ref.id);
    factoriesChecked += 1;
  }
  console.log(`      канон refs.ts: ${factoriesChecked} фабрик SourceRef, все docId/anchorId — из DOC/ANCHOR`);
  return { refIds, docIds, anchorIds };
}

function checkRefsAgainstCanon(
  label: string,
  events: AgentEvent[],
  canon: { refIds: Set<string>; docIds: Set<string>; anchorIds: Set<string> },
): number {
  const refs = refsFromEvents(events);
  for (const ref of refs) {
    assert.ok(canon.refIds.has(ref.id), `[${label}] SourceRef.id "${ref.id}" не найден среди фабрик refs.ts`);
    assert.ok(canon.docIds.has(ref.docId), `[${label}] SourceRef.docId "${ref.docId}" не найден в refs.DOC`);
    assert.ok(canon.anchorIds.has(ref.anchorId), `[${label}] SourceRef.anchorId "${ref.anchorId}" не найден в refs.ANCHOR`);
  }
  return refs.length;
}

/* ───────────────────────────────  3. все сценарии  ───────────────────────────────────── */

type Run = { label: string; events: AgentEvent[] };

async function runAllScenarios(
  scenarios: ScenariosModule,
  transport: AgentTransport,
): Promise<Run[]> {
  const runs: Run[] = [];

  // morningDigest — реальный путь запуска: прямой вызов, минуя подбор по
  // тексту (см. заголовочный комментарий scenarios/morningDigest.ts).
  {
    const ctx = makeCtx('dry-thread-morning-digest', 'today');
    const controller = new AbortController();
    const events = await collectEvents(scenarios.morningDigest.run(ctx, controller.signal, ''));
    runs.push({ label: 'morningDigest (прямой вызов)', events });
    assert.ok(
      scenarios.morningDigest.match('покажи дайджест'),
      'morningDigest.match("дайджест") должен также срабатывать как обычный сценарий',
    );
  }

  const bySend: Array<{ label: string; threadId: Id; input: string }> = [
    { label: 'autoRenewalScan', threadId: 'dry-thread-renewals', input: 'Проверь автопролонгации в портфеле' },
    { label: 'casePosition', threadId: 'dry-thread-position', input: 'Подготовь позицию, читаю отзыв ответчика' },
    { label: 'priceIncreaseRefusal', threadId: 'dry-thread-vektor', input: '«Вектор» просит повышение цены — что с отказом?' },
    { label: 'clarify', threadId: 'dry-thread-clarify', input: 'Хотим расторгнуть договор' },
    { label: 'failure (первая попытка → error)', threadId: 'dry-thread-failure', input: 'Нужна выписка из ЕГРЮЛ' },
    { label: 'failure (повтор → успех)', threadId: 'dry-thread-failure', input: 'Нужна выписка из ЕГРЮЛ' },
    { label: 'fallback (без узнанной темы)', threadId: 'dry-thread-fallback-generic', input: 'Какая сегодня погода в Москве?' },
    { label: 'fallback (с узнанной темой)', threadId: 'dry-thread-fallback-topic', input: 'Что там по договору аренды?' },
  ];

  for (const { label, threadId, input } of bySend) {
    const ctx = makeCtx(threadId);
    const events = await collectEvents(transport.send(input, ctx));
    runs.push({ label, events });
  }

  return runs;
}

/* ────────────────────────────────  4. отмена потока  ─────────────────────────────────── */

async function checkCancellation(transport: AgentTransport): Promise<void> {
  const threadId: Id = 'dry-thread-cancel';
  const ctx = makeCtx(threadId);
  const events: AgentEvent[] = [];

  const consuming = (async () => {
    for await (const event of transport.send('Проверь автопролонгации в портфеле', ctx)) {
      events.push(event);
    }
  })();

  // Реальные (немасштабированные) 200 мс: сценарий при SPEED_FACTOR=20
  // заведомо длиннее этого — отмена обязана прервать его на середине.
  await new Promise<void>((resolve) => setTimeout(resolve, 200));
  const startedAbortAt = Date.now();
  transport.cancel(threadId);

  const timedOut = Symbol('timeout');
  const result = await Promise.race([
    consuming.then(() => 'finished' as const),
    new Promise<typeof timedOut>((resolve) => setTimeout(() => resolve(timedOut), 3000)),
  ]);
  const abortToFinishMs = Date.now() - startedAbortAt;

  assert.notEqual(result, timedOut, 'генератор не завершился в течение 3с после cancel() — отмена не работает');
  assert.ok(
    !events.some((e) => e.t === 'done'),
    'после cancel() поток всё равно дошёл до done — значит отмена не прервала генератор',
  );
  console.log(
    `[3/4] cancel(): поток остановлен через ${abortToFinishMs}мс после cancel() ` +
      `(получено ${events.length} событий до отмены, ${summarizeEvents(events)}, done не эмитирован — как и ожидалось)`,
  );
}

/* ────────────────────────────────────────  main  ─────────────────────────────────────── */

async function main(): Promise<void> {
  const [{ tokenize }, content, refs, scenarios, { createMockTransport }] = await Promise.all([
    import('../src/core/agent/tokenize.ts'),
    import('../src/core/agent/scenarios/content.ts'),
    import('../src/core/agent/scenarios/refs.ts'),
    import('../src/core/agent/scenarios/index.ts'),
    import('../src/core/agent/mockTransport.ts'),
  ]);

  console.log(`dry-run-agent: VITE_AGENT_SPEED=${process.env['VITE_AGENT_SPEED']}\n`);

  await checkTokenizeRoundtrip(tokenize, content);

  console.log('[2/4] прогон всех сценариев…');
  const transport = createMockTransport();
  const runs = await runAllScenarios(scenarios, transport);
  const canon = buildCanon(refs);

  let totalRefsChecked = 0;
  for (const { label, events } of runs) {
    totalRefsChecked += checkRefsAgainstCanon(label, events, canon);
    const errorEvent = events.find((e): e is Extract<AgentEvent, { t: 'error' }> => e.t === 'error');
    const tail = errorEvent
      ? `error: "${errorEvent.message}" (retryable=${errorEvent.retryable})`
      : `preview: "${previewText(events)}"`;
    console.log(`  - ${label}: ${summarizeEvents(events)}\n      ${tail}`);
  }
  console.log(`      все SourceRef (${totalRefsChecked} шт.) сверены с канонoм refs.ts — расхождений нет\n`);

  await checkCancellation(transport);

  console.log('\n[4/4] все проверки пройдены.');
}

main().catch((err: unknown) => {
  console.error('\ndry-run-agent: ПРОВАЛ');
  console.error(err);
  process.exitCode = 1;
});
