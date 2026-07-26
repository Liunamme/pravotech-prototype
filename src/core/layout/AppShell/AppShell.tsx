import { useState } from 'react';
import { Outlet } from 'react-router';
import { useDeviceClass } from '@/shared/lib/useDeviceClass';
import { MobileSettingsSheet, MobileTabBar, MobileTopBar } from '../MobileChrome';
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
 */
export function AppShell() {
  const isMobile = useDeviceClass() === 'mobile';
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Узел корня — лист настроек выезжает внутри него, а не от края окна. */
  const [mobileRootEl, setMobileRootEl] = useState<HTMLDivElement | null>(null);

  const bloom = (
    <div className={styles.bloom} aria-hidden="true">
      <span className={styles.bloom1} />
      <span className={styles.bloom2} />
      <span className={styles.bloom3} />
    </div>
  );

  if (isMobile) {
    return (
      <div className={styles.mobileRoot} ref={setMobileRootEl}>
        {bloom}
        <MobileTopBar />
        <main className={styles.mobileContent}>
          <Outlet />
        </main>
        <MobileTabBar onOpenSettings={() => setSettingsOpen((open) => !open)} settingsOpen={settingsOpen} />
        <MobileSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} container={mobileRootEl} />
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
