import { Outlet } from 'react-router-dom';
import { Rail } from '../Rail/Rail';
import styles from './AppShell.module.css';

/**
 * Корневая сетка приложения: рейка слева + активная страница.
 * Высота — 100dvh, скролла на body нет; скроллятся только внутренние области
 * (см. reset.css: body { overflow: hidden }).
 */
export function AppShell() {
  return (
    <div className={styles.root}>
      <Rail />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
