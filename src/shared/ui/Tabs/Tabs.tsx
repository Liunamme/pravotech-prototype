import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/shared/lib/cn';
import styles from './Tabs.module.css';

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn(styles.list, className)} {...rest} />;
}

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger> & {
  icon?: ReactNode;
};

/** Триггер с индикатором активной вкладки и опциональной иконкой перед подписью. */
export function TabsTrigger({ icon, className, children, ...rest }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger className={cn(styles.trigger, className)} {...rest}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </RadixTabs.Trigger>
  );
}
