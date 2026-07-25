import clsx, { type ClassValue } from 'clsx';

/** Тонкая обёртка над clsx — единая точка для сборки classNames в проекте. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}
