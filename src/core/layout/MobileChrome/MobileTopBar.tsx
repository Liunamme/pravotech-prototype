import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useStore } from '@/store';
import { selectActiveTasks } from '@/store/selectors';
import { cn } from '@/shared/lib/cn';
import styles from './MobileTopBar.module.css';

export type MobileTopBarProps = {
  /**
   * Действие страницы слева от кнопки задач — на пространстве это открытие
   * списка диалогов. Слот, а не жёсткая кнопка: полоса не должна знать,
   * какая страница сейчас открыта.
   */
  action?: ReactNode;
};

/**
 * Верхняя полоса мобильной раскладки: логотип и вход в фоновые задачи.
 *
 * На десктопе логотип — абсолютно позиционированная надпись поверх стыка
 * рейки и сайдбара. На телефоне такой стык исчезает, и надпись поверх
 * содержимого перекрывала бы первую строку. Поэтому логотип получает
 * собственную строку в потоке.
 *
 * Переключателя темы здесь намеренно нет: он живёт в «Настройках», до
 * которых с телефона один тап по нижней вкладке. В полосе шириной 393px
 * каждый лишний значок отнимает место у того, что действительно нужно
 * в дороге.
 */
export function MobileTopBar({ action }: MobileTopBarProps) {
  const activeTasks = useStore(selectActiveTasks);
  const trayOpen = useStore((state) => state.trayOpen);
  const toggleTray = useStore((state) => state.toggleTray);
  const taskCount = activeTasks.length;

  return (
    <header className={styles.root}>
      <div className={styles.logo}>
        право<span className={styles.logoAccent}>(тех)</span>
      </div>

      <div className={styles.actions}>
        {action}

        <button
          type="button"
          className={cn(styles.iconButton, trayOpen && styles.active)}
          aria-label={taskCount > 0 ? `Фоновые задачи, активных: ${taskCount}` : 'Фоновые задачи'}
          aria-pressed={trayOpen}
          onClick={toggleTray}
        >
          <LoaderCircle size={17} strokeWidth={1.8} aria-hidden="true" />
          {taskCount > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {taskCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
