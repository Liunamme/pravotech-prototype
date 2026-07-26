import { useState } from 'react';
import { Outlet } from 'react-router';
import { useDeviceClass } from '@/shared/lib/useDeviceClass';
import { UnsupportedViewport } from '../UnsupportedViewport';
import { MobileTabBar, MobileTopBar } from '../MobileChrome';
import { Rail } from '../Rail/Rail';
import styles from './AppShell.module.css';

/**
 * Корневая сетка приложения: bloom-фон + навигация + активная страница.
 *
 * Фон — три радиальных «пятна» (bloom) под всем контентом (design_handoff):
 * decorative, pointer-events отключены. Рейка и сайдбар страницы лежат прямо
 * на этом фоне, а рабочая область — отдельная стеклянная плашка (см. страницы).
 *
 * Навигация меняется по классу устройства (docs/UX.md §8):
 *
 * • десктоп и планшет — вертикальная рейка слева, логотип поверх стыка;
 * • телефон — верхняя полоса с логотипом и нижние вкладки. Рейка отъедала бы
 *   56px из 393-х и всё равно оставалась бы недосягаемой для большого пальца.
 *
 * Заглушка `UnsupportedViewport` остаётся видна на мобильной ширине, пока
 * мобильная раскладка страниц не готова: каркас уже мобильный, а сами
 * страницы всё ещё трёхколоночные.
 */
export function AppShell() {
  const device = useDeviceClass();
  const isMobile = device === 'mobile';
  /**
   * Согласие «всё равно открыть» живёт в состоянии компонента: переходы
   * между страницами его сохраняют (`AppShell` не размонтируется), а
   * перезагрузка сбрасывает — следующий гость снова увидит предупреждение.
   */
  const [dismissed, setDismissed] = useState(false);

  if (isMobile && !dismissed) {
    return <UnsupportedViewport onDismiss={() => setDismissed(true)} />;
  }

  const bloom = (
    <div className={styles.bloom} aria-hidden="true">
      <span className={styles.bloom1} />
      <span className={styles.bloom2} />
      <span className={styles.bloom3} />
    </div>
  );

  if (isMobile) {
    return (
      <div className={styles.mobileRoot}>
        {bloom}
        <MobileTopBar />
        <main className={styles.mobileContent}>
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {bloom}
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
