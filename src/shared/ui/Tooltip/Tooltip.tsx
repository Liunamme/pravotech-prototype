import type { ReactElement, ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/shared/lib/cn';
import styles from './Tooltip.module.css';

export type TooltipProviderProps = {
  children: ReactNode;
  delayDuration?: number;
};

/** Единый провайдер задержки для всех тултипов приложения (~400ms). Монтировать один раз у корня. */
export function TooltipProvider({ children, delayDuration = 400 }: TooltipProviderProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  );
}

export type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
};

/** Обёртка над `@radix-ui/react-tooltip` со стрелкой и тенью `--shadow-md`. */
export function Tooltip({ content, children, side = 'top', sideOffset = 6, className }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content side={side} sideOffset={sideOffset} className={cn(styles.content, className)}>
          {content}
          <RadixTooltip.Arrow className={styles.arrow} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
