import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { LayoutDashboard, Moon, Scale, Settings, Sun } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { workspaces } from '@/workspaces/registry';
import { cn } from '@/shared/lib/cn';
import styles from './Rail.module.css';

function RailTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={8} className={styles.tooltip}>
          {label}
          <Tooltip.Arrow className={styles.tooltipArrow} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Rail() {
  const { theme, toggle } = useTheme();

  return (
    <Tooltip.Provider delayDuration={300}>
      <nav className={styles.root} aria-label="Основная навигация">
        <div className={styles.brand} aria-hidden="true">
          <Scale size={20} strokeWidth={2} />
        </div>

        <div className={styles.section}>
          <RailTooltip label="Сегодня">
            <NavLink
              to="/today"
              className={({ isActive }) => cn(styles.item, isActive && styles.active)}
              aria-label="Сегодня"
            >
              <LayoutDashboard size={20} strokeWidth={2} />
            </NavLink>
          </RailTooltip>
        </div>

        <div className={styles.divider} role="separator" aria-orientation="horizontal" />

        <div className={styles.section}>
          {workspaces.map((workspace) => {
            const Icon = workspace.icon;
            return (
              <RailTooltip key={workspace.id} label={workspace.title}>
                <NavLink
                  to={`/w/${workspace.id}`}
                  className={({ isActive }) => cn(styles.item, isActive && styles.active)}
                  aria-label={workspace.title}
                >
                  <Icon size={20} strokeWidth={2} />
                </NavLink>
              </RailTooltip>
            );
          })}
        </div>

        <div className={styles.spacer} />

        <div className={styles.section}>
          <RailTooltip label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}>
            <button
              type="button"
              className={styles.item}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              onClick={toggle}
            >
              {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            </button>
          </RailTooltip>

          <RailTooltip label="Настройки">
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(styles.item, isActive && styles.active)}
              aria-label="Настройки"
            >
              <Settings size={20} strokeWidth={2} />
            </NavLink>
          </RailTooltip>
        </div>
      </nav>
    </Tooltip.Provider>
  );
}
