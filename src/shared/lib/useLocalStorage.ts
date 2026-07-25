import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((prev: T) => T);

/**
 * Типизированный хук поверх localStorage с безопасным JSON-парсингом:
 * повреждённое/чужеродное значение в сторадже не роняет приложение,
 * а откатывается на defaultValue.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: SetValue<T>) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return defaultValue;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Хранилище недоступно (приватный режим, квота и т.п.) — тихо игнорируем.
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
