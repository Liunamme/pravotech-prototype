import { NavLink } from 'react-router';
import { Settings } from 'lucide-react';
import { TodayIcon } from '@/shared/ui/icons/AppIcons';
import { workspaces } from '@/workspaces/registry';
import styles from './MobileTabBar.module.css';

/**
 * Нижняя навигация — мобильная замена рейки (макет
 * `pravotex-adaptive.dc.html`, раскладка `mobile`).
 *
 * Почему низ, а не тот же вертикальный столбец: рейка отъедала бы 56px из
 * 393-х — седьмую часть экрана, — и всё равно осталась бы недосягаемой для
 * большого пальца. Нижняя полоса решает обе задачи.
 *
 * Состав повторяет рейку: «Сегодня», рабочие пространства из реестра,
 * «Настройки». Ничего не захардкожено — новое пространство появится здесь
 * само (docs/DOMAIN.md §8).
 *
 * Активная вкладка помечается через `[aria-current='page']`, который
 * `NavLink` ставит сам, а не функцией `className={({isActive}) => …}` —
 * та же причина, что и у рейки (см. `Rail.tsx`).
 */
export function MobileTabBar() {
  return (
    <nav className={styles.root} aria-label="Основная навигация">
      <NavLink to="/today" className={styles.item}>
        <TodayIcon size={18} />
        <span className={styles.label}>Сегодня</span>
      </NavLink>

      {workspaces.map((workspace) => {
        const Icon = workspace.icon;
        return (
          <NavLink key={workspace.id} to={`/w/${workspace.id}`} className={styles.item}>
            <Icon size={17} strokeWidth={1.8} />
            <span className={styles.label}>{workspace.shortTitle}</span>
          </NavLink>
        );
      })}

      <NavLink to="/settings" className={styles.item}>
        <Settings size={17} strokeWidth={1.8} />
        <span className={styles.label}>Настройки</span>
      </NavLink>
    </nav>
  );
}
