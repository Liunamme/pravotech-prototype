/**
 * Пороги адаптива — единственный источник правды.
 *
 * Три класса устройств (docs/UX.md §8):
 *
 *   мобильный  < 768px      одна колонка, нижние табы
 *   планшет    768–1279px   чат + очередь в выдвижной панели
 *   десктоп    ≥ 1280px     три колонки (то, что сделано)
 *
 * Почему 768: самый ходовой рубеж в индустрии (`md` и в Tailwind, и в
 * Bootstrap). Ниже него все телефоны в портрете — iPhone SE 375, iPhone 15
 * 393, Pro Max 430.
 *
 * Почему 1280: iPad 11" в альбоме — 1194, и три колонки туда не влезают, так
 * что он честно планшет; iPad Pro 12.9" в альбоме — 1366, и там места с
 * запасом, это уже десктоп. Планшетный холст макета (834×1112) ложится в
 * середину планшетной полосы.
 *
 * Отдельное правило по высоте: телефон в альбоме — это 932×430, по ширине он
 * попал бы в планшет, хотя планшетная раскладка в 430px высоты не помещается.
 * Всё, что ниже 500px, считается мобильным независимо от ширины; заодно это
 * корректно отрабатывает открытую экранную клавиатуру.
 *
 * Пороги записаны и здесь, и в CSS-медиазапросах. Дублирование намеренное:
 * CSS-переменную в `@media` подставить нельзя. Меняя число тут, ищите
 * `768px` и `1280px` по всем файлам `.module.css`.
 */

export const BREAKPOINTS = {
  /** Ниже — мобильная раскладка. */
  tablet: 768,
  /** Начиная с этой ширины — полный десктоп. */
  desktop: 1280,
  /** Ниже этой высоты раскладка считается мобильной при любой ширине. */
  shortViewport: 500,
} as const;

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

/** Медиазапросы под каждый класс — для `useMediaQuery`. */
export const MEDIA = {
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px), (max-height: ${BREAKPOINTS.shortViewport - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px) and (min-height: ${BREAKPOINTS.shortViewport}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px) and (min-height: ${BREAKPOINTS.shortViewport}px)`,
} as const;

/** Класс устройства по размерам окна. Вынесено функцией — чтобы покрыть тестами. */
export function classifyViewport(width: number, height: number): DeviceClass {
  if (height < BREAKPOINTS.shortViewport) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}
