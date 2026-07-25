import type { HTMLAttributes } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import styles from './Dialog.module.css';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export type DialogContentProps = RadixDialog.DialogContentProps;

/** Оверлей-скрим + центрированный контент, вход scale+fade, выход короче (~70%). */
export function DialogContent({ className, children, ...rest }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={styles.overlay} />
      <RadixDialog.Content className={cn(styles.content, className)} {...rest}>
        {children}
        <RadixDialog.Close className={styles.close} aria-label="Закрыть">
          <X size={16} strokeWidth={2} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.header, className)} {...rest} />;
}

export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.footer, className)} {...rest} />;
}
