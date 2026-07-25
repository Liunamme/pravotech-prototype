import { useState, type ReactNode } from 'react';
import type { AgentTransport } from '@/types/domain';
import { AgentTransportProvider } from '@/core/agent/transport';
import { createMockTransport } from '@/core/agent/mockTransport';
import { ToastProvider, TooltipProvider } from '@/shared/ui';
import { ThemeProvider } from './ThemeProvider';

/**
 * Единая точка сборки провайдеров верхнего уровня.
 *
 * Транспорт агента создаётся один раз через `useState(() => ...)` (ленивый
 * инициализатор, не на каждый рендер) и живёт в React-состоянии, а не в
 * модульной переменной — так `AgentTransportProvider` управляет им обычным
 * образом, и в тестах/сторибуке можно подменить `transport` пропом без
 * правки этого файла. Замена мока на реальный SSE-транспорт — одна строка
 * здесь (docs/DOMAIN.md, раздел 7).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [transport] = useState<AgentTransport>(() => createMockTransport());

  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider>
          <AgentTransportProvider transport={transport}>{children}</AgentTransportProvider>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
