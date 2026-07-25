import { Handshake, ListChecks } from 'lucide-react';
import type { ContextTabDef } from '@/workspaces/types';
import { ContractsTab } from './ContractsTab';
import { ObligationsTab } from './ObligationsTab';

export const obligationsContextTabs: ContextTabDef[] = [
  { id: 'contracts', label: 'Договоры', icon: Handshake, Component: ContractsTab },
  { id: 'obligations', label: 'Обязательства', icon: ListChecks, Component: ObligationsTab },
];
