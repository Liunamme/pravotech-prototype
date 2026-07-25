/**
 * Вкладка контекста «Договоры» (docs/DOMAIN.md §8, `ContextTabDef`).
 *
 * Список договорного портфеля: контрагент, срок и статус автопродления —
 * колонки, которых нет ни в очереди карточек, ни в другой вкладке этого же
 * пространства («Обязательства», задача-центричная). Автопродление и срок
 * уведомления читаются не из статичного текста документа, а из живой
 * карточки `renewal_notice` того же договора (если она есть в очереди) —
 * иначе демо «протухло» бы: даты в карточках уже относительны `new Date()`
 * (docs/SCENARIOS.md §2), а зашитая в документ строка — нет.
 */
import { useMemo } from 'react';
import { Handshake, Repeat } from 'lucide-react';
import type { Id } from '@/types/domain';
import type { RenewalNoticePayload } from '@/core/agent/scenarios/cards';
import { useStore } from '@/store';
import { EmptyState } from '@/shared/ui';
import { formatDate } from '@/shared/lib/date';
import styles from './ContractsTab.module.css';

export function ContractsTab({ workspaceId }: { workspaceId: Id }) {
  const documents = useStore((state) => state.documents);
  const cards = useStore((state) => state.cards);
  const openInspector = useStore((state) => state.openInspector);

  const rows = useMemo(() => {
    const contracts = Object.values(documents).filter(
      (doc) => doc.workspaceId === workspaceId && doc.kind === 'contract',
    );
    const renewalCards = Object.values(cards).filter(
      (card): card is typeof card & { payload: RenewalNoticePayload } =>
        card.workspaceId === workspaceId && card.type === 'renewal_notice',
    );

    return contracts
      .map((doc) => ({
        doc,
        renewal: renewalCards.find((card) => card.payload.contractDocId === doc.id),
      }))
      .sort((a, b) => a.doc.title.localeCompare(b.doc.title, 'ru'));
  }, [documents, cards, workspaceId]);

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          icon={Handshake}
          title="Документов пока нет"
          description="Здесь появятся договоры и материалы дел этого пространства."
        />
      </div>
    );
  }

  return (
    <div className={styles.root} aria-label="Договорный портфель">
      {rows.map(({ doc, renewal }) => (
        <button
          key={doc.id}
          type="button"
          className={styles.row}
          onClick={() => openInspector(doc.id)}
          aria-label={`Открыть документ: ${doc.title}`}
        >
          <div className={styles.cell}>
            <span className={styles.title}>{doc.title}</span>
            {doc.parties && <span className={styles.parties}>{doc.parties.join(' · ')}</span>}
          </div>

          <div className={styles.cell}>
            <span className={styles.cellLabel}>Автопродление</span>
            <span className={styles.cellValue}>
              {renewal ? (
                <span className={styles.renewalBadge}>
                  <Repeat size={12} strokeWidth={1.75} aria-hidden="true" />
                  до {formatDate(renewal.payload.renewalDate)}
                </span>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className={styles.cell}>
            <span className={styles.cellLabel}>Уведомить до</span>
            <span className={styles.cellValue}>{renewal ? formatDate(renewal.payload.noticeDeadline) : '—'}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
