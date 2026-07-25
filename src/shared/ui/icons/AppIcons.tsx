/**
 * Кастомные иконки навигации — воспроизводят inline-SVG из дизайн-макета
 * (design_handoff/pravotex-desktop.dc.html) 1:1, потому что lucide-аналоги
 * визуально отличаются (заливная сетка «Сегодня», колонна правосудия «Дела»).
 *
 * Сигнатура совместима с `LucideIcon` по использованию (`size`, `strokeWidth`,
 * `className`, `aria-hidden`), поэтому иконки взаимозаменяемы с lucide в рейке,
 * сайдбаре и манифестах пространств.
 */
import type { ComponentType, SVGProps } from 'react';

export type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  /** `number | string` — как у LucideProps, чтобы lucide-иконки были присваиваемы AppIcon. */
  size?: number | string;
};

/**
 * Общий тип иконки навигации. Шире `LucideIcon`: любую lucide-иконку можно
 * присвоить `AppIcon`, а также кастомные иконки отсюда — так манифесты и рейка
 * работают и с теми, и с другими.
 */
export type AppIcon = ComponentType<AppIconProps>;

/** «Сегодня» — заливная сетка 2×2 из закруглённых квадратов (диагональ приглушена). */
export function TodayIcon({ size = 16, strokeWidth: _s, ...rest }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...rest}>
      <rect x="1" y="1" width="6" height="6" rx="1.6" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.6" fill="currentColor" opacity="0.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.6" fill="currentColor" opacity="0.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.6" fill="currentColor" />
    </svg>
  );
}

/** «Обязательства» — документ (контур + строки текста). */
export function ContractIcon({ size = 16, strokeWidth = 1.3, ...rest }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...rest}>
      <rect x="2.5" y="1" width="11" height="14" rx="2" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
      <rect x="5" y="5" width="6" height="1.3" rx="0.65" fill="currentColor" />
      <rect x="5" y="8.4" width="6" height="1.3" rx="0.65" fill="currentColor" />
      <rect x="5" y="11.8" width="3.6" height="1.3" rx="0.65" fill="currentColor" />
    </svg>
  );
}

/** «Дела» — колонна правосудия: навершие, стойка, основание, перекладина. */
export function GavelStandIcon({ size = 16, strokeWidth: _s, ...rest }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...rest}>
      <circle cx="8" cy="3" r="1.7" fill="currentColor" />
      <rect x="7.3" y="4.2" width="1.4" height="9.6" rx="0.7" fill="currentColor" />
      <rect x="2.5" y="13" width="11" height="1.4" rx="0.7" fill="currentColor" />
      <rect x="2.2" y="6.4" width="11.6" height="1.2" rx="0.6" fill="currentColor" opacity="0.65" />
    </svg>
  );
}
