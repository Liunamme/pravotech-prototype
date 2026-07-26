import { useState } from 'react';
import { Outlet } from 'react-router';
import { useDeviceClass } from '@/shared/lib/useDeviceClass';
import { UnsupportedViewport } from '../UnsupportedViewport';
import { Rail } from '../Rail/Rail';
import styles from './AppShell.module.css';

/**
 * Корневая сетка приложения: bloom-фон + рейка слева + активная страница.
 *
 * Фон — три радиальных «пятна» (bloom) под всем контентом (design_handoff):
 * decorative, pointer-events отключены. Рейка и сайдбар страницы лежат прямо
 * на этом фоне, а рабочая область — отдельная стеклянная плашка (см. страницы).
 *
 * Пока планшетной и мобильной раскладок нет, на узких экранах вместо сетки
 * показывается честная заглушка (`UnsupportedViewport`): десктопные колонки
 * там не сжимаются, а разъезжаются за край экрана. По мере готовности
 * раскладок ветки отсюда убираются — сначала `tablet`, потом `mobile`.
 */
export function AppShell() {
  const device = useDeviceClass();
  /**
   * Согласие «всё равно открыть» живёт в состоянии компонента: переходы
   * между страницами его сохраняют (`AppShell` не размонтируется), а
   * перезагрузка сбрасывает — следующий гость снова увидит предупреждение.
   */
  const [dismissed, setDismissed] = useState(false);

  if (device !== 'desktop' && !dismissed) {
    return <UnsupportedViewport device={device} onDismiss={() => setDismissed(true)} />;
  }

  return (
    <div className={styles.root}>
      <div className={styles.bloom} aria-hidden="true">
        <span className={styles.bloom1} />
        <span className={styles.bloom2} />
        <span className={styles.bloom3} />
      </div>
      <div className={styles.logo}>
        право<span className={styles.logoAccent}>(тех)</span>
      </div>
      <Rail />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
