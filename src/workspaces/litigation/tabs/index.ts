import { Scale, CalendarClock } from 'lucide-react';
import type { ContextTabDef } from '@/workspaces/types';
import { CasesTab } from './CasesTab';
import { HearingsTab } from './HearingsTab';

export const litigationContextTabs: ContextTabDef[] = [
  { id: 'cases', label: 'Дела', icon: Scale, Component: CasesTab },
  { id: 'hearings', label: 'Заседания', icon: CalendarClock, Component: HearingsTab },
];
