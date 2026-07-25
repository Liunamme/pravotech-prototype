import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import styles from './Toast.module.css';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Например `{ label: 'Отменить', onClick: () => undo(id) }` — ключевой сценарий продукта. */
  action?: ToastAction;
  /** По умолчанию 5000ms; для undo-тостов вызывающий код передаёт 6000. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: string; open: boolean };

type ToastContextValue = {
  toast: (options: ToastOptions) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;
/** Держим в синхроне с длительностью выходной анимации в Toast.module.css. */
const EXIT_ANIMATION_MS = 200;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast должен использоваться внутри ToastProvider');
  return ctx;
}

export type ToastProviderProps = {
  children: ReactNode;
};

/**
 * Провайдер стека тостов с поддержкой undo-действия — ключевое требование
 * продукта (агент подтверждает решения юриста именно через undo-тост, а не
 * блокирующий confirm). Не крадёт фокус: Radix Toast не переносит фокус на
 * тост при появлении. `type="background"` даёт `aria-live="polite"`.
 * Стек ограничен `MAX_VISIBLE` — старые тосты вытесняются новыми.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++idRef.current}`;
    setToasts((prev) => {
      const next = [...prev, { ...options, id, open: true }];
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });
    return id;
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (open) return;
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={DEFAULT_DURATION}>
        {children}
        {toasts.map((item) => (
          <ToastView key={item.id} item={item} onOpenChange={(open) => handleOpenChange(item.id, open)} />
        ))}
        <RadixToast.Viewport className={styles.viewport} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onOpenChange }: { item: ToastItem; onOpenChange: (open: boolean) => void }) {
  const [paused, setPaused] = useState(false);
  const variant = item.variant ?? 'default';
  const duration = item.duration ?? DEFAULT_DURATION;
  const progressStyle = { '--toast-duration': `${duration}ms` } as CSSProperties;

  return (
    <RadixToast.Root
      className={cn(styles.root, styles[`variant_${variant}`])}
      type="background"
      open={item.open}
      duration={duration}
      onOpenChange={onOpenChange}
      onPause={() => setPaused(true)}
      onResume={() => setPaused(false)}
    >
      <div className={styles.body}>
        <RadixToast.Title className={styles.title}>{item.title}</RadixToast.Title>
        {item.description && (
          <RadixToast.Description className={styles.description}>{item.description}</RadixToast.Description>
        )}
      </div>
      <div className={styles.controls}>
        {item.action && (
          <RadixToast.Action altText={item.action.label} asChild onClick={item.action.onClick}>
            <button type="button" className={styles.action}>
              {item.action.label}
            </button>
          </RadixToast.Action>
        )}
        <RadixToast.Close className={styles.close} aria-label="Закрыть уведомление">
          <X size={14} strokeWidth={2} />
        </RadixToast.Close>
      </div>
      <div className={cn(styles.progress, paused && styles.progressPaused)} style={progressStyle} aria-hidden="true" />
    </RadixToast.Root>
  );
}
