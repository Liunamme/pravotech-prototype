import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { workspaces } from '@/workspaces/registry';
import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui';
import styles from './MobileSettingsSheet.module.css';

export type MobileSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement | null;
};

/** Насколько нужно утянуть лист вниз, чтобы он закрылся, а не вернулся на место. */
const CLOSE_THRESHOLD_PX = 90;

/**
 * Настройки на телефоне — лист, выезжающий снизу, а не отдельная страница
 * (макет `pravotex-adaptive.dc.html`, раскладка `mobile`).
 *
 * Настройка ровно одна — тема, — и ради неё уводить человека на целый экран
 * не за что: он теряет то место, где работал, и вынужден возвращаться назад.
 * Лист открывается поверх и закрывается на месте.
 *
 * Обзор рабочих пространств, который занимает половину десктопной страницы
 * настроек, сюда не переехал намеренно: на телефоне пространства и так
 * стоят вкладками в нижней навигации, и повторять их списком незачем.
 * Полная страница `/settings` остаётся на десктопе и планшете.
 *
 * Закрыть можно тремя способами, и это не роскошь: крестик — для точного
 * тапа, `Esc` — для внешней клавиатуры и скринридера, потяг вниз за полоску
 * — привычный жест для листа, которым пользуются не глядя. Порог в 90px
 * отделяет намеренный жест от случайного касания при прокрутке.
 */
export function MobileSettingsSheet({ open, onOpenChange, container }: MobileSettingsSheetProps) {
  const { theme, setTheme } = useTheme();

  /** Смещение листа во время перетаскивания. `null` — жеста нет. */
  const [dragY, setDragY] = useState<number | null>(null);
  const dragStartRef = useRef<number | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragStartRef.current = event.clientY;
    setDragY(0);
    // Захват указателя: палец может уехать за пределы полоски, и без этого
    // события перестали бы приходить на середине жеста.
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current === null) return;
    // Только вниз: тянуть лист вверх некуда, он уже прижат к краю.
    setDragY(Math.max(0, event.clientY - dragStartRef.current));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartRef.current === null) return;
    const distance = event.clientY - dragStartRef.current;
    dragStartRef.current = null;
    setDragY(null);
    if (distance > CLOSE_THRESHOLD_PX) onOpenChange(false);
  }

  const dragging = dragY !== null;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <RadixDialog.Portal container={container ?? undefined}>
        {/* Затемнение с размытием: то, что под листом, уходит на второй план
            и перестаёт отвлекать. Клик по нему закрывает — привычно для
            листа и быстрее, чем целиться в крестик. */}
        <div className={styles.scrim} onClick={() => onOpenChange(false)} aria-hidden="true" />

        <RadixDialog.Content
          className={styles.content}
          aria-describedby={undefined}
          data-dragging={dragging || undefined}
          style={dragging ? { transform: `translateY(${dragY}px)` } : undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className={styles.glass} aria-hidden="true" />

          {/* Зона захвата шире самой полоски: попасть пальцем в 4px нельзя. */}
          <div
            className={styles.handleArea}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className={styles.grabber} aria-hidden="true" />
          </div>

          <RadixDialog.Close asChild>
            <IconButton className={styles.close} variant="ghost" size="sm" aria-label="Закрыть настройки">
              <X size={15} strokeWidth={2} />
            </IconButton>
          </RadixDialog.Close>

          <RadixDialog.Title className={styles.visuallyHidden}>Настройки</RadixDialog.Title>

          {/* Модели пользователя в прототипе нет (аутентификация вне границ
              задачи) — та же статичная визуальная деталь, что и в аккаунте
              боковой колонки на десктопе. */}
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">
              ЭЗ
            </span>
            <span className={styles.accountBody}>
              <span className={styles.accountName}>Э. Задорожный</span>
              <span className={styles.accountRole}>Юрист · ООО «Меридиан Групп»</span>
            </span>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Тема</h3>
            <div className={styles.themeRow} role="radiogroup" aria-label="Тема оформления">
              {(
                [
                  { value: 'light', label: 'Светлая', icon: Sun },
                  { value: 'dark', label: 'Тёмная', icon: Moon },
                ] as const
              ).map((option) => {
                const Icon = option.icon;
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={cn(styles.themeButton, active && styles.themeButtonActive)}
                    onClick={() => setTheme(option.value)}
                  >
                    <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className={styles.about}>ПравоТех · прототип · {workspaces.length}&nbsp;рабочих пространства</p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
