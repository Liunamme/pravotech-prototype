import { Monitor, Smartphone } from 'lucide-react';
import { BREAKPOINTS } from '@/shared/lib/breakpoints';
import { Button } from '@/shared/ui';
import styles from './UnsupportedViewport.module.css';

export type UnsupportedViewportProps = {
  /** «Всё равно открыть» — снимает заглушку до перезагрузки страницы. */
  onDismiss: () => void;
};

/**
 * Экран вместо приложения на мобильной ширине.
 *
 * Зачем: мобильной раскладке нужна другая навигация (нижние табы, очередь
 * отдельным разделом), и до неё десктопная сетка на узком экране не
 * «сжимается», а разъезжается — колонки уходят за край, половина интерфейса
 * недостижима. Показать честное «версия в разработке» лучше, чем сломанный
 * экран, по которому судят о продукте.
 *
 * Заглушка не глухая: внизу есть блёклая ссылка «всё равно открыть». Нужна
 * и разработчику (проверять вёрстку с реального телефона по ходу работы), и
 * упрямому пользователю — запирать человека наглухо в его же браузере
 * невежливо. Согласие живёт до перезагрузки страницы: снявший заглушку
 * понимает, на что идёт, но следующий гость снова увидит предупреждение.
 *
 * Планшетный вариант отсюда убран вместе с готовой планшетной раскладкой:
 * текст «планшетная версия делается» стал бы неправдой. Когда доедет
 * мобильная — компонент удаляется целиком.
 */
export function UnsupportedViewport({ onDismiss }: UnsupportedViewportProps) {
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
          <Smartphone size={26} strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>Мобильная версия в разработке</h1>
        <p className={styles.lead}>
          Интерфейс собран под десктоп и планшет. Мобильная раскладка — со своей навигацией и
          очередью отдельным разделом — сейчас делается.
        </p>

        {/* Порог планшета, а не десктопа: планшетная раскладка уже работает,
            и звать «разверните до 1280» значило бы просить лишнего. */}
        <p className={styles.hint}>
          <Monitor size={15} strokeWidth={1.75} aria-hidden="true" />
          Откройте на экране шириной от {BREAKPOINTS.tablet}px — или разверните окно браузера.
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
