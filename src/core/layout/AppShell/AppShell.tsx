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
 * Планшетная раскладка (768–1279px) готова: рейка и сайдбар остаются, а
 * очередь уезжает в выдвижную панель (`QueueDrawer`). Заглушка осталась
 * только для мобильной ширины — там нужна другая навигация, и десктопная
 * сетка не сжимается, а разъезжается за край экрана. Когда мобильная
 * раскладка будет готова, отсюда уходит и эта ветка, а
 * `UnsupportedViewport` удаляется целиком.
 */
export function AppShell() {
  const device = useDeviceClass();
  /**
   * Согласие «всё равно открыть» живёт в состоянии компонента: переходы
   * между страницами его сохраняют (`AppShell` не размонтируется), а
   * перезагрузка сбрасывает — следующий гость снова увидит предупреждение.
   */
  const [dismissed, setDismissed] = useState(false);

  if (device === 'mobile' && !dismissed) {
    return <UnsupportedViewport onDismiss={() => setDismissed(true)} />;
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
