import { useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import { workspaces } from '@/workspaces/registry';
import { formatWeekdayDate } from '@/shared/lib/date';
import styles from './DayNav.module.css';

/**
 * Навигация дня — левая колонка уровня 1 (ASCII-раскладка tech-task.md,
 * docs/UX.md §1). Не дублирует рейку (та даёт переход между уровнями
 * платформы в принципе) — здесь ответ на «с чего начать сегодня»: дата,
 * и список пространств с числом карточек, ждущих решения именно там.
 *
 * Генерическая: перебирает `workspaces` из реестра, не знает конкретных
 * пространств (SPEC §2, инвариант ядра).
 */
export function DayNav() {
  const cards = useStore((state) => state.cards);

  const countByWorkspace = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of Object.values(cards)) {
      if (card.state !== 'pending') continue;
      counts[card.workspaceId] = (counts[card.workspaceId] ?? 0) + 1;
    }
    return counts;
  }, [cards]);

  return (
    <nav className={styles.root} aria-label="Навигация дня">
      <div className={styles.dateBlock}>
        <p className={styles.date}>{formatWeekdayDate(new Date())}</p>
      </div>

      <Link to="/today" className={styles.todayLink}>
        <LayoutDashboard size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Сегодня</span>
      </Link>

      {workspaces.length > 0 && (
        <div className={styles.workspaceList}>
          <p className={styles.sectionLabel}>Рабочие пространства</p>
          {workspaces.map((workspace) => {
            const count = countByWorkspace[workspace.id] ?? 0;
            const Icon = workspace.icon;
            return (
              <Link key={workspace.id} to={`/w/${workspace.id}`} className={styles.workspaceItem}>
                <Icon size={16} strokeWidth={1.75} className={styles.workspaceIcon} aria-hidden="true" />
                <span className={styles.workspaceLabel}>{workspace.shortTitle}</span>
                {count > 0 && <span className={styles.workspaceCount}>{count}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {/* Аккаунт внизу колонки (design_handoff строки ~113-116) — в проекте
          нет модели пользователя/аутентификации (вне границ задачи), поэтому
          это статичная визуальная деталь раскладки, как и в самом макете. */}
      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">
          ЭЗ
        </span>
        <span className={styles.accountBody}>
          <span className={styles.accountName}>Э. Задорожный</span>
          <span className={styles.accountRole}>Юрист</span>
        </span>
      </div>
    </nav>
  );
}
