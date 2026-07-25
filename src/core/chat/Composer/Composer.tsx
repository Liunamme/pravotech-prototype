import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './Composer.module.css';

export type ComposerHandle = {
  /** Подставляет текст в поле ввода и передаёт ему фокус (клик по чипу навыка — ТЗ 4b.6). */
  prefill: (text: string) => void;
};

export type ComposerProps = {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

/**
 * Поле ввода снизу треда. Во время стриминга основная кнопка превращается
 * в «Остановить» — единственный способ отправить новую реплику поверх
 * активного прогона это сначала остановить текущий (см. `useAgentStream`:
 * `sendUserMessage`/`runTrigger` не запускаются, пока `isStreaming`).
 *
 * Чипы навыков живут в пустом состоянии `MessageList` (docs/UX.md §6) —
 * клик там вызывает `prefill` через этот handle, чтобы подсказка и поле
 * ввода оставались синхронными без подъёма локального состояния `value`
 * на уровень `ChatView`.
 */
export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { isStreaming, onSend, onStop },
  ref,
) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоувеличение textarea по контенту; максимум по высоте задаёт CSS
  // (`max-height` в px-эквиваленте 6 строк, посчитанном из токенов —
  // см. Composer.module.css), дальше — внутренний скролл.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useImperativeHandle(ref, () => ({
    prefill(text: string) {
      setValue(text);
      textareaRef.current?.focus();
    },
  }));

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Пока идёт стриминг, Enter не отправляет: единственный способ
      // прервать активный прогон — явный клик по кнопке «Остановить»,
      // чтобы случайный Enter во время чтения ответа не обрывал его.
      if (!isStreaming) handleSend();
    }
  }

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className={styles.root}>
      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Спросите агента или опишите задачу…"
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Круглая кнопка-иконка (design_handoff: 38px, только пиктограмма) —
            `Button` без `children` не рендерит текстовую подпись, `aria-label`
            остаётся единственным описанием для a11y. */}
        {isStreaming ? (
          <Button
            variant="primary"
            iconLeft={<Square size={11} strokeWidth={2} fill="currentColor" />}
            onClick={onStop}
            className={styles.action}
            aria-label="Остановить"
          />
        ) : (
          <Button
            variant="primary"
            iconLeft={<Send size={16} strokeWidth={2} />}
            onClick={handleSend}
            disabled={!canSend}
            className={styles.action}
            aria-label="Отправить"
          />
        )}
      </div>

      <p className={styles.hint}>
        {isStreaming ? 'Агент отвечает — можно остановить' : 'Enter — отправить · Shift+Enter — перенос строки'}
      </p>
    </div>
  );
});
