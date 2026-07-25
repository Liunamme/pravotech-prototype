/**
 * Манифест пространства «Обязательства по договорам» (docs/DOMAIN.md §8,
 * docs/SCENARIOS.md §2). Единственная точка сборки — реестр (`registry.ts`)
 * подключает это единым литеральным элементом массива.
 */
import { FileText } from 'lucide-react';
import type { WorkspaceManifest } from '@/workspaces/types';
import { obligationsCardTypes } from './cards';
import { obligationsContextTabs } from './tabs';
import { obligationsSkills } from './skills';
import { obligationsSeed } from './seed';

export const obligationsManifest: WorkspaceManifest = {
  id: 'obligations',
  title: 'Обязательства по договорам',
  shortTitle: 'Обязательства',
  icon: FileText,
  description:
    'Сроки автопродления, претензии контрагентов и платежи по договорному портфелю — что нужно решить и к какому сроку.',
  contextTabs: obligationsContextTabs,
  cardTypes: obligationsCardTypes,
  skills: obligationsSkills,
  seed: obligationsSeed,
};
