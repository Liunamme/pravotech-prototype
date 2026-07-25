/**
 * Утилита сравнения payload карточки «до» и «после» правки в режиме
 * «Изменить» (docs/UX.md §2, §5.5 задания этапа 5).
 *
 * Возвращает множество верхнеуровневых ключей, значение которых отличается —
 * используется и для подсветки полей в `EditForm` (`--color-warning-subtle`
 * + левая полоска), и для показа изменений у карточки в состоянии `modified`.
 *
 * Сравнение по значению, не по ссылке: `EditForm` обычно строит новый объект
 * на каждое изменение поля (`{ ...payload, field: value }`), поэтому наивное
 * `!==` пометило бы неизменённые вложенные объекты/массивы как «изменённые»
 * только из-за новой ссылки. Для payload карточек (плоские JSON-совместимые
 * структуры, см. `CardTypeDef<P>`) сравнение через `JSON.stringify` даёт
 * корректный результат и не тянет отдельную deep-equal зависимость.
 */
export function diffPayload<P>(original: P, modified: P): Set<string> {
  const changed = new Set<string>();

  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  if (!isPlainObject(original) || !isPlainObject(modified)) {
    if (!valueEqual(original, modified)) changed.add('value');
    return changed;
  }

  const keys = new Set([...Object.keys(original), ...Object.keys(modified)]);
  for (const key of keys) {
    if (!valueEqual(original[key], modified[key])) changed.add(key);
  }
  return changed;
}

function valueEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
