import { describe, expect, it } from 'vitest';
import { BREAKPOINTS, classifyViewport } from './breakpoints';

/**
 * Пороги проверяются не «на глаз», а по реальным устройствам: ошибка здесь
 * означает, что человек с планшетом увидит мобильную заглушку или, наоборот,
 * разъехавшийся десктоп.
 */
const DESKTOP_HEIGHT = 900;

describe('classifyViewport — реальные устройства', () => {
  const cases: Array<[string, number, number, string]> = [
    ['iPhone SE, портрет', 375, 667, 'mobile'],
    ['iPhone 15, портрет', 393, 852, 'mobile'],
    ['iPhone 15 Pro Max, портрет', 430, 932, 'mobile'],
    // Лёжа телефон широкий, но низкий — планшетная раскладка туда не влезет.
    ['iPhone 15 Pro Max, альбом', 932, 430, 'mobile'],
    ['iPad mini, портрет', 744, 1133, 'mobile'],
    ['iPad 10.9", портрет', 810, 1080, 'tablet'],
    ['планшет из макета', 834, 1112, 'tablet'],
    ['iPad Pro 11", альбом', 1194, 834, 'tablet'],
    ['iPad Pro 12.9", портрет', 1024, 1366, 'tablet'],
    ['iPad Pro 12.9", альбом', 1366, 1024, 'desktop'],
    ['ноутбук 1440', 1440, 900, 'desktop'],
    ['монитор 1920', 1920, 1080, 'desktop'],
  ];

  for (const [name, width, height, expected] of cases) {
    it(`${name} (${width}×${height}) → ${expected}`, () => {
      expect(classifyViewport(width, height)).toBe(expected);
    });
  }
});

describe('границы порогов', () => {
  it('на пикселе ниже порога — ещё мобильный, на пороге — уже планшет', () => {
    expect(classifyViewport(BREAKPOINTS.tablet - 1, DESKTOP_HEIGHT)).toBe('mobile');
    expect(classifyViewport(BREAKPOINTS.tablet, DESKTOP_HEIGHT)).toBe('tablet');
  });

  it('на пикселе ниже порога — ещё планшет, на пороге — уже десктоп', () => {
    expect(classifyViewport(BREAKPOINTS.desktop - 1, DESKTOP_HEIGHT)).toBe('tablet');
    expect(classifyViewport(BREAKPOINTS.desktop, DESKTOP_HEIGHT)).toBe('desktop');
  });

  it('низкое окно считается мобильным при любой ширине', () => {
    // Открытая экранная клавиатура и телефон в альбоме дают ровно этот случай.
    expect(classifyViewport(1920, BREAKPOINTS.shortViewport - 1)).toBe('mobile');
    expect(classifyViewport(1920, BREAKPOINTS.shortViewport)).toBe('desktop');
  });
});
