import { Monitor, Smartphone, TabletSmartphone } from 'lucide-react';
import type { DeviceClass } from '@/shared/lib/breakpoints';
import { BREAKPOINTS } from '@/shared/lib/breakpoints';
import { Button } from '@/shared/ui';
import styles from './UnsupportedViewport.module.css';

export type UnsupportedViewportProps = {
  /** Что за устройство обнаружено. `desktop` сюда не приходит. */
  device: Exclude<DeviceClass, 'desktop'>;
  /** «Всё равно открыть» — снимает заглушку до перезагрузки страницы. */
  onDismiss: () => void;
};

const COPY: Record<UnsupportedViewportProps['device'], { icon: typeof Smartphone; title: string; lead: string }> = {
  mobile: {
    icon: Smartphone,
    title: 'Мобильная версия в разработке',
    lead: 'Интерфейс собран под десктоп. Мобильная раскладка — со своей навигацией и очередью отдельным разделом — сейчас делается.',
  },
  tablet: {
    icon: TabletSmartphone,
    title: 'Планшетная версия в разработке',
    lead: 'Интерфейс собран под десктоп. Планшетная раскладка — с чатом во всю ширину и выдвижной очередью — сейчас делается.',
  },
};

/**
 * Экран вместо приложения на неподдержанной ширине.
 *
 * Зачем: до появления планшетной и мобильной раскладок десктопная сетка на
 * узком экране не «сжимается», а разъезжается — колонки уходят за край,
 * половина интерфейса недостижима. Показать честное «версия в разработке»
 * лучше, чем сломанный экран, по которому судят о продукте.
 *
 * Заглушка не глухая: внизу есть блёклая ссылка «всё равно открыть». Нужна
 * и разработчику (проверять вёрстку с реального телефона по ходу работы), и
 * упрямому пользователю — запирать человека наглухо в его же браузере
 * невежливо. Согласие живёт до перезагрузки страницы: снявший заглушку
 * понимает, на что идёт, но следующий гость снова увидит предупреждение.
 *
 * Убирается по частям: когда планшетная раскладка будет готова, из
 * `AppShell` уходит ветка `tablet`, и заглушка остаётся только для мобильной.
 */
export function UnsupportedViewport({ device, onDismiss }: UnsupportedViewportProps) {
  const { icon: Icon, title, lead } = COPY[device];
  const width = typeof window === 'undefined' ? 0 : window.innerWidth;

  return (
    <div className={styles.root} role="alert">
      <div className={styles.bloom} aria-hidden="true">
        <span className={styles.bloom1} />
        <span className={styles.bloom2} />
      </div>

      <div className={styles.card}>
        <div className={styles.logo}>
          право<span className={styles.logoAccent}>(тех)</span>
        </div>

        <div className={styles.iconWrap} aria-hidden="true">
          <Icon size={26} strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>

        <p className={styles.hint}>
          <Monitor size={15} strokeWidth={1.75} aria-hidden="true" />
          Откройте на экране шириной от {BREAKPOINTS.desktop}px — или разверните окно браузера.
        </p>

        {/* Конкретное число вместо общего «экран слишком узкий»: сразу видно,
            насколько не хватает, и что дело в ширине окна, а не в устройстве. */}
        <p className={styles.measure}>Сейчас ширина окна — {width}px</p>

        <Button variant="ghost" size="sm" className={styles.dismiss} onClick={onDismiss}>
          Всё равно открыть
        </Button>
      </div>
    </div>
  );
}
