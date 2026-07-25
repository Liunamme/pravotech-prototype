import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/cn';
import styles from './Popover.module.css';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverClose = RadixPopover.Close;
export const PopoverAnchor = RadixPopover.Anchor;

export type PopoverContentProps = RadixPopover.PopoverContentProps;

/** Обёртка над `@radix-ui/react-popover` со стрелкой и тенью `--shadow-lg`. */
export function PopoverContent({
  className,
  children,
  sideOffset = 6,
  ...rest
}: PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content className={cn(styles.content, className)} sideOffset={sideOffset} {...rest}>
        {children}
        <RadixPopover.Arrow className={styles.arrow} />
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
