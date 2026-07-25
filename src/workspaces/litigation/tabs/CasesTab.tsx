/**
 * Вкладка контекста «Дела» (docs/DOMAIN.md §8, `ContextTabDef`).
 *
 * Одна строка — одно дело: номер/стороны из документа искового заявления
 * (`kind: 'court_filing'`), стадия из его `meta` (заведена в сиде — этап 6,
 * `seed/documents.ts`), ближайшее заседание — из живого календаря (не из
 * статичного текста документа, иначе демо «протухло» бы). Колонки
 * умышленно другие, чем в «Договорах» пространства «Обязательства»
 * (задание этапа 6, п. 6.4 — разные вкладки с разными колонками).
 */
import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import type { Id } from '@/types/domain';
import { useStore } from '@/store';
import { EmptyState } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/date';
import styles from './CasesTab.module.css';

export function CasesTab({ workspaceId }: { workspaceId: Id }) {
  const documents = useStore((state) => state.documents);
  const events = useStore((state) => state.events);

  const rows = useMemo(() => {
    const cases = Object.values(documents).filter(
      (doc) => doc.workspaceId === workspaceId && doc.kind === 'court_filing',
    );
    const hearings = Object.values(events).filter(
      (event) => event.workspaceId === workspaceId && event.kind === 'hearing',
    );

    return cases
      .map((doc) => {
        const nextHearing = hearings
          .filter((event) => event.subjectRef?.id === doc.id)
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
        return { doc, nextHearing };
      })
      .sort((a, b) => a.doc.title.localeCompare(b.doc.title, 'ru'));
  }, [documents, events, workspaceId]);

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          icon={Briefcase}
          title="Документов пока нет"
          description="Здесь появятся договоры и материалы дел этого пространства."
        />
      </div>
    );
  }

  return (
    <div className={styles.root} role="table" aria-label="Портфель дел">
      {rows.map(({ doc, nextHearing }) => (
        <div key={doc.id} className={styles.row} role="row">
          <div className={styles.cell} role="cell">
            <span className={styles.title}>{doc.title}</span>
            {doc.parties && <span className={styles.parties}>{doc.parties.join(' · ')}</span>}
          </div>

          <div className={styles.cell} role="cell">
            <span className={styles.cellLabel}>Стадия</span>
            <span className={styles.cellValue}>{doc.meta?.['Стадия'] ?? '—'}</span>
          </div>

          <div className={styles.cell} role="cell">
            <span className={styles.cellLabel}>Ближайшее заседание</span>
            <span className={styles.cellValue}>{nextHearing ? formatDateTime(nextHearing.at) : '—'}</span>
          </div>

          <div className={styles.cell} role="cell">
            <span className={styles.cellLabel}>Место</span>
            <span className={styles.cellValue}>{nextHearing?.location ?? '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
