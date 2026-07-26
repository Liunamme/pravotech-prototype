import type { ReactElement } from 'react';
import { NavLink } from 'react-router';
import { LoaderCircle, Moon, Settings, Sun } from 'lucide-react';
import { Tooltip } from '@/shared/ui';
import { TodayIcon } from '@/shared/ui/icons/AppIcons';
import { useTheme } from '@/app/ThemeProvider';
import { useStore } from '@/store';
import { selectActiveTasks } from '@/store/selectors';
import { workspaces } from '@/workspaces/registry';
import { cn } from '@/shared/lib/cn';
import styles from './Rail.module.css';

/**
 * Подсказка рейки — общий `Tooltip` из `shared/ui`, только сбоку. Своей копии
 * стилей у рейки нет намеренно: копия разъезжается с общей (так и вышло —
 * в общей подсказке фон и текст оказались одного цвета, а рейка об этом не
 * знала). Задержку задаёт единый `TooltipProvider` в `app/providers.tsx`.
 */
function RailTooltip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip content={label} side="right" sideOffset={10}>
      {children}
    </Tooltip>
  );
}

/**
 * Активная страница у ссылок рейки помечается через `[aria-current='page']`
 * (его `NavLink` ставит сам), а НЕ функцией `className={({isActive}) => …}`:
 * `Tooltip.Trigger asChild` склеивает className строкой, и функция попадала в
 * атрибут своим исходным текстом — стили `.item` к ссылкам не применялись
 * вовсе (не было ни коробки 38×38, ни ховера, ни активной плашки).
 */
export function Rail() {
  const { theme, toggle } = useTheme();
  const activeTasks = useStore(selectActiveTasks);
  const taskCount = activeTasks.length;
  const trayOpen = useStore((state) => state.trayOpen);
  const toggleTray = useStore((state) => state.toggleTray);

  return (
    <nav className={styles.root} aria-label="Основная навигация">
      <div className={styles.top}>
        <RailTooltip label="Сегодня">
          <NavLink to="/today" className={styles.item} aria-label="Сегодня">
            <TodayIcon size={18} />
          </NavLink>
        </RailTooltip>

        <div className={styles.divider} role="separator" aria-orientation="horizontal" />

        {workspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <RailTooltip key={workspace.id} label={workspace.title}>
              <NavLink to={`/w/${workspace.id}`} className={styles.item} aria-label={workspace.title}>
                <Icon size={16} strokeWidth={1.8} />
              </NavLink>
            </RailTooltip>
          );
        })}
      </div>

      <div className={styles.spacer} />

      <div className={styles.bottom}>
        <RailTooltip label="Фоновые задачи">
          <button
            type="button"
            className={cn(styles.item, trayOpen && styles.active)}
            aria-label="Фоновые задачи"
            aria-pressed={trayOpen}
            onClick={toggleTray}
          >
            <LoaderCircle size={16} strokeWidth={1.8} />
            {taskCount > 0 && <span className={styles.badge}>{taskCount}</span>}
          </button>
        </RailTooltip>

        <RailTooltip label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
          <button
            type="button"
            className={styles.item}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            onClick={toggle}
          >
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
          </button>
        </RailTooltip>

        <RailTooltip label="Настройки">
          <NavLink to="/settings" className={styles.item} aria-label="Настройки">
            <Settings size={16} strokeWidth={1.8} />
          </NavLink>
        </RailTooltip>
      </div>
    </nav>
  );
}
