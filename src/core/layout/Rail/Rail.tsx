import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { LoaderCircle, Moon, Settings, Sun } from 'lucide-react';
import { TodayIcon } from '@/shared/ui/icons/AppIcons';
import { useTheme } from '@/app/ThemeProvider';
import { useStore } from '@/store';
import { selectActiveTasks } from '@/store/selectors';
import { workspaces } from '@/workspaces/registry';
import { cn } from '@/shared/lib/cn';
import styles from './Rail.module.css';

function RailTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={10} className={styles.tooltip}>
          {label}
          <Tooltip.Arrow className={styles.tooltipArrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Rail() {
  const { theme, toggle } = useTheme();
  const activeTasks = useStore(selectActiveTasks);
  const taskCount = activeTasks.length;
  const trayOpen = useStore((state) => state.trayOpen);
  const toggleTray = useStore((state) => state.toggleTray);

  return (
    <Tooltip.Provider delayDuration={300}>
      <nav className={styles.root} aria-label="Основная навигация">
        <div className={styles.top}>
          <RailTooltip label="Сегодня">
            <NavLink
              to="/today"
              className={({ isActive }) => cn(styles.item, isActive && styles.active)}
              aria-label="Сегодня"
            >
              <TodayIcon size={18} />
            </NavLink>
          </RailTooltip>

          <div className={styles.divider} role="separator" aria-orientation="horizontal" />

          {workspaces.map((workspace) => {
            const Icon = workspace.icon;
            return (
              <RailTooltip key={workspace.id} label={workspace.title}>
                <NavLink
                  to={`/w/${workspace.id}`}
                  className={({ isActive }) => cn(styles.item, isActive && styles.active)}
                  aria-label={workspace.title}
                >
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
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(styles.item, isActive && styles.active)}
              aria-label="Настройки"
            >
              <Settings size={16} strokeWidth={1.8} />
            </NavLink>
          </RailTooltip>
        </div>
      </nav>
    </Tooltip.Provider>
  );
}
