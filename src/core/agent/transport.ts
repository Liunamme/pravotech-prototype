/**
 * Точка подмены транспорта агента (docs/DOMAIN.md, раздел 7).
 *
 * Критичный инвариант: ни один компонент не импортирует конкретную
 * реализацию транспорта (мок или будущий SSE-клиент) напрямую — только
 * через `useAgentTransport()`. Замена реализации — одна строка в проп
 * `transport` у `AgentTransportProvider`, без правок компонентов.
 *
 * Реализация мока — этап 4. Здесь только контракт и React-обвязка.
 *
 * Файл намеренно `.ts`, а не `.tsx`: JSX-элемент строится через
 * `createElement`, чтобы не переносить компонент в отдельный файл
 * ради одной строки разметки.
 */

import { createContext, createElement, useContext } from 'react';
import type { ReactNode } from 'react';
import type { AgentTransport } from '@/types/domain';

export type { AgentTransport } from '@/types/domain';

const AgentTransportContext = createContext<AgentTransport | null>(null);

export type AgentTransportProviderProps = {
  transport: AgentTransport;
  children: ReactNode;
};

/** Принимает любую реализацию `AgentTransport` через проп `transport`. */
export function AgentTransportProvider({ transport, children }: AgentTransportProviderProps) {
  return createElement(AgentTransportContext.Provider, { value: transport }, children);
}

/** Бросает, если вызван вне `AgentTransportProvider` — тихая заглушка хуже честной ошибки. */
export function useAgentTransport(): AgentTransport {
  const transport = useContext(AgentTransportContext);
  if (!transport) {
    throw new Error('useAgentTransport() вызван вне <AgentTransportProvider>.');
  }
  return transport;
}
