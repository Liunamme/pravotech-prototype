import { describe, expect, it } from 'vitest';
import { newId } from './id';

describe('newId', () => {
  it('не повторяется при быстром создании подряд', () => {
    // Ровно тот сценарий, из-за которого id перестали собирать из времени:
    // несколько тредов, созданных в одну миллисекунду, получали один ключ и
    // затирали друг друга в сторе.
    const ids = Array.from({ length: 5000 }, () => newId('thread'));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('сохраняет читаемый префикс', () => {
    expect(newId('thread')).toMatch(/^thread-[0-9a-f-]{36}$/);
    expect(newId('msg-a')).toMatch(/^msg-a-[0-9a-f-]{36}$/);
  });
});
