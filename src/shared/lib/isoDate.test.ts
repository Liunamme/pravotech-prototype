import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { isValidCalendarDate, isValidIsoDateTime, toDateInputValue, withNewDate } from './isoDate';

/**
 * Главное свойство: правка срока даёт один и тот же результат, где бы ни
 * сидел юрист. Прежняя реализация парсила ISO через `new Date()` и собирала
 * смещение из часового пояса машины — под Гонолулу те же входы давали другую
 * дату и другое смещение, а на границе перехода на летнее время — сдвиг на
 * час. Поэтому одни и те же проверки гоняются под тремя зонами.
 */
const ZONES = ['Europe/Moscow', 'UTC', 'Pacific/Honolulu', 'Australia/Lord_Howe'];

/**
 * `getTimezoneOffset()` в июле: Москва −180, UTC 0, Гонолулу +600 (без
 * перехода на летнее время), Лорд-Хау −630 (смещение с получасом — нарочно,
 * такие зоны ломают наивную сборку строки).
 */
const EXPECTED_OFFSET_MIN: Record<string, number> = {
  'Europe/Moscow': -180,
  UTC: 0,
  'Pacific/Honolulu': 600,
  'Australia/Lord_Howe': -630,
};
const originalTz = process.env.TZ;

afterAll(() => {
  process.env.TZ = originalTz;
});

for (const zone of ZONES) {
  describe(`часовой пояс ${zone}`, () => {
    // Именно `beforeEach`, а не тело describe: тела describe выполняются все
    // сразу на сборе тестов, и до самих проверок дожила бы только последняя
    // зона — «проверка под тремя поясами» оказалась бы фикцией.
    beforeEach(() => {
      process.env.TZ = zone;
    });

    it('среда действительно переключается — иначе проверки ниже ничего не стоят', () => {
      // Если Node проигнорирует смену `TZ`, все зоны дадут одно смещение и
      // «проверка под четырьмя поясами» окажется одной и той же проверкой.
      expect(new Date('2026-07-24T12:00:00Z').getTimezoneOffset()).toBe(EXPECTED_OFFSET_MIN[zone]);
    });

    it('читает календарную дату в смещении самого срока, а не машины', () => {
      expect(toDateInputValue('2026-07-24T09:15:00+03:00')).toBe('2026-07-24');
      // Полночь по Москве — самый опасный вход: западнее это ещё вчера.
      expect(toDateInputValue('2026-07-24T00:30:00+03:00')).toBe('2026-07-24');
      expect(toDateInputValue('2026-07-24T23:45:00+03:00')).toBe('2026-07-24');
    });

    it('меняет дату, не трогая время и смещение', () => {
      expect(withNewDate('2026-07-24T09:15:00+03:00', '2026-08-01')).toBe('2026-08-01T09:15:00+03:00');
      expect(withNewDate('2026-07-24T00:00:00+03:00', '2026-12-31')).toBe('2026-12-31T00:00:00+03:00');
      // Отрицательное смещение сохраняется как есть, а не пересчитывается.
      expect(withNewDate('2026-07-24T09:15:00-05:00', '2026-07-25')).toBe('2026-07-25T09:15:00-05:00');
      expect(withNewDate('2026-07-24T09:15:00Z', '2026-07-25')).toBe('2026-07-25T09:15:00Z');
    });

    it('не спотыкается о переход на летнее время', () => {
      // 29 марта 2026 — переход в Европе; правка через эту границу не должна
      // ни сдвигать время, ни менять смещение.
      expect(withNewDate('2026-03-28T02:30:00+01:00', '2026-03-30')).toBe('2026-03-30T02:30:00+01:00');
    });

    it('оставляет срок нетронутым при негодном вводе', () => {
      const iso = '2026-07-24T09:15:00+03:00';
      expect(withNewDate(iso, '')).toBe(iso);
      expect(withNewDate(iso, '2026-02-30')).toBe(iso);
      expect(withNewDate(iso, '2026-13-01')).toBe(iso);
      expect(withNewDate(iso, 'не дата')).toBe(iso);
    });
  });
}

describe('isValidCalendarDate', () => {
  it('пропускает существующие даты, включая високосные', () => {
    expect(isValidCalendarDate('2026-07-24')).toBe(true);
    expect(isValidCalendarDate('2024-02-29')).toBe(true);
    expect(isValidCalendarDate('2026-12-31')).toBe(true);
  });

  it('отвергает несуществующие и кривые', () => {
    expect(isValidCalendarDate('2026-02-29')).toBe(false); // не високосный
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
    expect(isValidCalendarDate('2026-04-31')).toBe(false);
    expect(isValidCalendarDate('2026-13-01')).toBe(false);
    expect(isValidCalendarDate('2026-00-10')).toBe(false);
    expect(isValidCalendarDate('2026-7-24')).toBe(false); // без ведущего нуля
    expect(isValidCalendarDate('')).toBe(false);
  });
});

describe('isValidIsoDateTime', () => {
  it('различает пригодный срок и мусор', () => {
    expect(isValidIsoDateTime('2026-07-24T09:15:00+03:00')).toBe(true);
    expect(isValidIsoDateTime('2026-07-24')).toBe(true);
    expect(isValidIsoDateTime('2026-02-30T09:15:00+03:00')).toBe(false);
    expect(isValidIsoDateTime('вчера')).toBe(false);
    expect(isValidIsoDateTime('')).toBe(false);
  });
});
