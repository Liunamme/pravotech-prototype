/**
 * Навыки агента пространства «Судебные дела» (docs/DOMAIN.md §8, `AgentSkill`).
 * Тексты подобраны так, чтобы попадать в сценарии мока
 * (`core/agent/scenarios/index.ts`, docs/SCENARIOS.md §3): подготовка позиции
 * с уходом в фон, разбор дела, проверка процессуальных сроков. Не декоративные
 * ярлыки — за каждым стоит поведение.
 */
import { FileSearch, Gavel, ScrollText } from 'lucide-react';
import type { AgentSkill } from '@/workspaces/types';

export const litigationSkills: AgentSkill[] = [
  {
    id: 'lit-position',
    label: 'Подготовить позицию по делу',
    prompt: 'Подготовь позицию и возражения на отзыв по делу А40-118742',
    icon: Gavel,
  },
  {
    id: 'lit-case-status',
    label: 'Что нового по делу',
    prompt: 'Что нового по делу А40-118742',
    icon: FileSearch,
  },
  {
    id: 'lit-deadlines',
    label: 'Проверить процессуальные сроки',
    prompt: 'Проверить процессуальные сроки по делам',
    icon: ScrollText,
  },
];
