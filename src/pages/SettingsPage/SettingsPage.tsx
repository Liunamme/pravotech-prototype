import { Link } from 'react-router-dom';
import { FlaskConical, Scale } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { workspaces } from '@/workspaces/registry';
import { useStore } from '@/store';
import { InspectorSlot } from '@/core/layout/InspectorSlot';
import { BackgroundTaskTray } from '@/core/tasks/BackgroundTaskTray';
import { Card, SegmentedControl } from '@/shared/ui';
import styles from './SettingsPage.module.css';

/**
 * Настройки (7.5 задания этапа): тема, список рабочих пространств, «о
 * прототипе». Витрина примитивов этапа 2 переехала на отдельный маршрут
 * `/settings/kitchen-sink` (см. `router.tsx`) — полезна для отладки, но не
 * часть пользовательского пути, поэтому здесь только ссылка на неё.
 */
export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const documents = useStore((state) => state.documents);
  const cards = useStore((state) => state.cards);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.hint}>Оформление платформы и обзор подключённых рабочих пространств.</p>
      </header>

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Тема</h2>
          <SegmentedControl
            aria-label="Тема оформления"
            value={theme}
            onValueChange={(value) => setTheme(value as 'light' | 'dark')}
            options={[
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Тёмная' },
            ]}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Рабочие пространства</h2>
          {workspaces.length === 0 ? (
            <p className={styles.emptyNote}>Ни одно пространство пока не подключено.</p>
          ) : (
            <div className={styles.workspaceGrid}>
              {workspaces.map((workspace) => {
                const Icon = workspace.icon;
                const docCount = Object.values(documents).filter((d) => d.workspaceId === workspace.id).length;
                const cardCount = Object.values(cards).filter(
                  (c) => c.workspaceId === workspace.id && c.state === 'pending',
                ).length;
                return (
                  <Card key={workspace.id} className={styles.workspaceCard}>
                    <div className={styles.workspaceHeader}>
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span className={styles.workspaceTitle}>{workspace.title}</span>
                    </div>
                    <p className={styles.workspaceDescription}>{workspace.description}</p>
                    <div className={styles.workspaceStats}>
                      <span>{docCount} документов</span>
                      <span>{cardCount} карточек в очереди</span>
                      <span>{workspace.skills.length} навыков</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>О прототипе</h2>
          <div className={styles.aboutCard}>
            <Scale size={20} strokeWidth={1.75} className={styles.aboutIcon} aria-hidden="true" />
            <div>
              <p className={styles.aboutTitle}>ПравоТех</p>
              <p className={styles.aboutText}>
                Прототип агентной платформы для юристов: диалог с агентом в центре, карточки действий
                справа, документы и сроки — на расстоянии одного клика. Данные — демонстрационные,
                агент — заготовленные сценарии поверх единого транспортного интерфейса.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Для отладки</h2>
          <Link to="/settings/kitchen-sink" className={styles.kitchenSinkLink}>
            <FlaskConical size={14} strokeWidth={1.75} aria-hidden="true" />
            Витрина компонентов
          </Link>
        </section>
      </div>

      <InspectorSlot />
      <BackgroundTaskTray />
    </div>
  );
}
