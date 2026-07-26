import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeTransportFailure, isAbortError } from './transportError';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isAbortError', () => {
  it('узнаёт отмену — она не сбой', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    const named = new Error('canceled');
    named.name = 'AbortError';
    expect(isAbortError(named)).toBe(true);
  });

  it('не принимает за отмену настоящий сбой', () => {
    expect(isAbortError(new TypeError('Failed to fetch'))).toBe(false);
    expect(isAbortError(new Error('HTTP 500'))).toBe(false);
    expect(isAbortError('строка')).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});

describe('describeTransportFailure', () => {
  it('различает обрыв сети и таймаут', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(describeTransportFailure(new TypeError('Failed to fetch')).message).toMatch(/связаться с агентом/);
    expect(describeTransportFailure(new DOMException('slow', 'TimeoutError')).message).toMatch(/не ответил вовремя/);
  });

  it('всегда предлагает повтор', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const error of [new TypeError('x'), new Error('HTTP 401'), new Error('HTTP 429'), { weird: true }]) {
      expect(describeTransportFailure(error).retryable).toBe(true);
    }
  });

  it('не выносит наружу текст исключения — там бывают URL и токены', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const leak = new Error('401 at https://api.example/agent?token=s3cret (tenant=acme)');
    const { message } = describeTransportFailure(leak);

    expect(message).not.toContain('token');
    expect(message).not.toContain('api.example');
    expect(message).not.toContain('acme');
    expect(message).not.toContain(leak.message);
  });
});
