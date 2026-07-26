import { Outlet } from 'react-router';
import { Rail } from '../Rail/Rail';
import styles from './AppShell.module.css';

/**
 * Корневая сетка приложения: bloom-фон + рейка слева + активная страница.
 *
 * Фон — три радиальных «пятна» (bloom) под всем контентом (design_handoff):
 * decorative, pointer-events отключены. Рейка и сайдбар страницы лежат прямо
 * на этом фоне, а рабочая область — отдельная стеклянная плашка (см. страницы).
 */
export function AppShell() {
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
