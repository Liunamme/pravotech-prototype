/**
 * Модель времени мок-агента (docs/SCENARIOS.md, §1).
 *
 * Единственный источник всех задержек сценариев — ничего не хардкодится
 * по месту в `scenarios/*`. `SPEED_FACTOR` позволяет ускорить прогон
 * целиком (отладка, запись демо, `scripts/dry-run-agent.ts`) без правки
 * самих сценариев: он не меняет форму потока событий, только его темп.
 *
 * Файл не знает про React и не импортирует ничего из `store`/`shared/ui`.
 */

type EnvRecord = Record<string, string | undefined>;

/**
 * Читает `VITE_AGENT_SPEED` из `import.meta.env` (реальный запуск через Vite)
 * либо из `process.env` (запуск сценариев вне Vite — например, dry-run
 * скриптом через `tsx`, где `import.meta.env` не существует вовсе).
 * Обращение через `globalThis`-каст — чтобы не требовать `@types/node`
 * в `tsconfig.app.json` (там намеренно только `types: ["vite/client"]`).
 */
function readEnvValue(key: string): string | undefined {
  const metaEnv = (import.meta as unknown as { env?: EnvRecord }).env;
  const fromVite = metaEnv?.[key];
  if (fromVite !== undefined) return fromVite;

  const nodeProcess = (globalThis as { process?: { env?: EnvRecord } }).process;
  return nodeProcess?.env?.[key];
}

function readSpeedFactor(): number {
  const raw = readEnvValue('VITE_AGENT_SPEED');
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Глобальный множитель темпа. >1 — быстрее, <1 — медленнее. По умолчанию 1. */
export const SPEED_FACTOR = readSpeedFactor();

/** Значения — ровно из §1 `docs/SCENARIOS.md`, в миллисекундах, до применения `SPEED_FACTOR`. */
export const TIMING = {
  /** Задержка между токенами: нижняя граница диапазона джиттера. */
  tokenDelayMin: 16,
  /** Задержка между токенами: верхняя граница диапазона джиттера. */
  tokenDelayMax: 34,
  /** Дополнительная пауза после токена, оканчивающегося на `.`, `:` или `;`. */
  punctuationPause: 60,
  /** Задержка перед первым токеном ответа («агент думает») — нижняя граница. */
  firstTokenDelayMin: 500,
  /** Задержка перед первым токеном ответа («агент думает») — верхняя граница. */
  firstTokenDelayMax: 900,
  /** Типичный шаг статуса длинной операции — нижняя граница. */
  statusStepMin: 700,
  /** Типичный шаг статуса длинной операции — верхняя граница. */
  statusStepMax: 1400,
  /** Операция дольше этого порога уходит в фон (`handoff`). */
  backgroundThresholdMs: 3000,
  /** Пауза перед появлением карточки после завершения текста. */
  cardRevealDelay: 350,
} as const;

const PUNCTUATION_PAUSE_CHARS = new Set(['.', ':', ';']);

/**
 * `await sleep(ms)` — единственная точка, где применяется `SPEED_FACTOR`.
 * Все сценарии обязаны ждать только через неё (никаких `setTimeout`-цепочек).
 *
 * Если передан `signal`, уже поставленный или отменённый во время ожидания
 * `AbortSignal` немедленно резолвит промис — это то, что делает отмену
 * потока мгновенной, а не ждущей окончания текущего шага.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  const scaled = Math.max(0, ms / SPEED_FACTOR);

  if (signal?.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, scaled);

    function onAbort(): void {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Случайное значение в `[base, base + spread)`. */
export function jitter(base: number, spread: number): number {
  return base + Math.random() * spread;
}

/**
 * Задержка перед показом конкретного токена — с джиттером между токенами
 * и дополнительной паузой, если токен оканчивается на знак препинания.
 * Возвращает «сырые» миллисекунды (масштабирование — забота `sleep`).
 */
export function tokenDelay(token: string): number {
  const base = jitter(TIMING.tokenDelayMin, TIMING.tokenDelayMax - TIMING.tokenDelayMin);
  const trimmed = token.trimEnd();
  const lastChar = trimmed.length > 0 ? trimmed.charAt(trimmed.length - 1) : '';
  const pause = PUNCTUATION_PAUSE_CHARS.has(lastChar) ? TIMING.punctuationPause : 0;
  return base + pause;
}

/** Случайная задержка «агент думает» перед первым токеном ответа. */
export function firstTokenDelay(): number {
  return jitter(TIMING.firstTokenDelayMin, TIMING.firstTokenDelayMax - TIMING.firstTokenDelayMin);
}

/** Случайная длительность одного шага статуса длинной операции. */
export function statusStepDelay(): number {
  return jitter(TIMING.statusStepMin, TIMING.statusStepMax - TIMING.statusStepMin);
}
