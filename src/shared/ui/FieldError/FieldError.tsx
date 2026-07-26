import styles from './FieldError.module.css';

/**
 * Подпись об ошибке под полем формы. Нет сообщения — нет и узла: пустая
 * строка занимала бы место и раздвигала форму ровно так же, как раньше это
 * делала жёлтая плашка правки (тот же довод, что у `data-changed`
 * в `cards.module.css`).
 *
 * `role="alert"` — чтобы экранный диктор прочитал причину сразу после
 * нажатия «Сохранить и подтвердить», а не только при возврате фокуса в поле.
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <span className={styles.root} role="alert">
      {message}
    </span>
  );
}
