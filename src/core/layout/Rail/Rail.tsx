import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { LayoutDashboard, LoaderCircle, Moon, Settings, Sun } from 'lucide-react';
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

export type RailProps = {
  onOpenTasks?: () => void;
  onOpenSettings?: () => void;
  tasksActive?: boolean;
  settingsActive?: boolean;
};

export function Rail({ onOpenTasks, onOpenSettings, tasksActive, settingsActive }: RailProps) {
  const { theme, toggle } = useTheme();
  const activeTasks = useStore(selectActiveTasks);
  const taskCount = activeTasks.length;

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
              <LayoutDashboard size={16} strokeWidth={1.8} />
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
              className={cn(styles.item, tasksActive && styles.active)}
              aria-label="Фоновые задачи"
              onClick={onOpenTasks}
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
            <button
              type="button"
              className={cn(styles.item, settingsActive && styles.active)}
              aria-label="Настройки"
              onClick={onOpenSettings}
            >
              <Settings size={16} strokeWidth={1.8} />
            </button>
          </RailTooltip>
        </div>
      </nav>
    </Tooltip.Provider>
  );
}
