/**
 * Манифест пространства «Судебные дела» (docs/DOMAIN.md §8,
 * docs/SCENARIOS.md §2). Подключается реестром единым литеральным элементом.
 *
 * Разнотипность с `obligations` (задание этапа 6, п. 6.4): другие типы карточек
 * (hearing_prep / evidence_request / filing_deadline, последний — destructive),
 * другие вкладки контекста (Дела / Заседания — хронология вместо портфеля),
 * другие навыки. Раскладка и оболочка карточки — те же.
 */
import { Gavel } from 'lucide-react';
import type { WorkspaceManifest } from '@/workspaces/types';
import { litigationCardTypes } from './cards';
import { litigationContextTabs } from './tabs';
import { litigationSkills } from './skills';
import { litigationSeed } from './seed';

export const litigationManifest: WorkspaceManifest = {
  id: 'litigation',
  title: 'Судебные дела',
  shortTitle: 'Дела',
  icon: Gavel,
  description:
    'Заседания, доказательства и процессуальные сроки по судебным делам — что подготовить и подать, чтобы не пропустить срок.',
  contextTabs: litigationContextTabs,
  cardTypes: litigationCardTypes,
  skills: litigationSkills,
  seed: litigationSeed,
};
