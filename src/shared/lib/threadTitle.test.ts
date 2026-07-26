import { describe, expect, it } from 'vitest';
import { NEW_THREAD_TITLE, threadTitleFromMessage } from './threadTitle';

describe('threadTitleFromMessage', () => {
  it('берёт первое предложение и делает из него тему', () => {
    expect(threadTitleFromMessage('проверь автопролонгации. И ещё сроки')).toBe('Проверь автопролонгации');
    expect(threadTitleFromMessage('Что с делом А40?')).toBe('Что с делом А40');
    expect(threadTitleFromMessage('Собери позицию\nи приложи практику')).toBe('Собери позицию');
  });

  it('схлопывает пробелы и снимает хвостовую пунктуацию', () => {
    expect(threadTitleFromMessage('  найди   письмо   «Вектора» —  ')).toBe('Найди письмо «Вектора»');
  });

  it('обрезает длинное по границе слова, без обрубков', () => {
    const title = threadTitleFromMessage(
      'Проверь все договоры поставки на предмет условий об индексации цены и подготовь сводку',
    );
    expect(title.length).toBeLessThanOrEqual(53); // 52 + многоточие
    expect(title.endsWith('…')).toBe(true);
    expect(title).not.toMatch(/\s\S{1,2}…$/); // не обрывается на предлоге
  });

  it('не переименовывает тред в пустоту', () => {
    expect(threadTitleFromMessage('')).toBe(NEW_THREAD_TITLE);
    expect(threadTitleFromMessage('   ')).toBe(NEW_THREAD_TITLE);
    expect(threadTitleFromMessage('...')).toBe(NEW_THREAD_TITLE);
  });
});
