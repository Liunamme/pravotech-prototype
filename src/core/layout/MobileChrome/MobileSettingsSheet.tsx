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

/**
 * Настройки на телефоне — лист, выезжающий снизу, а не отдельная страница
 * (макет `pravotex-adaptive.dc.html`, раскладка `mobile`).
 *
 * Настроек ровно одна — тема, — и ради неё уводить человека на целый экран
 * не за что: он теряет то место, где работал, и вынужден возвращаться
 * назад. Лист снизу открывается поверх и закрывается на месте.
 *
 * Обзор рабочих пространств, который занимает половину десктопной страницы
 * настроек, сюда не переехал намеренно: на телефоне пространства и так
 * стоят вкладками в нижней навигации, и повторять их списком незачем.
 * Полная страница `/settings` остаётся на десктопе и планшете.
 *
 * Устроен как остальные панели: `modal={false}` (лист, а не модалка —
 * иначе Radix блокирует прокрутку body и дёргает раскладку), стекло
 * отдельным инертным слоем (`backdrop-filter` делает элемент backdrop root,
 * и прокрутка проваливалась бы сквозь лист).
 */
export function MobileSettingsSheet({ open, onOpenChange, container }: MobileSettingsSheetProps) {
  const { theme, setTheme } = useTheme();

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Content
          className={styles.content}
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className={styles.glass} aria-hidden="true" />

          {/* Визуальная «ручка» листа: подсказывает, что это выезжающая
              панель, а не приросший к экрану блок. */}
          <div className={styles.grabber} aria-hidden="true" />

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

          <p className={styles.about}>
            ПравоТех · прототип · {workspaces.length}&nbsp;рабочих пространства
          </p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
