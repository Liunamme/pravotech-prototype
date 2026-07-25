/**
 * Навыки агента пространства «Обязательства» (docs/DOMAIN.md §8,
 * `AgentSkill`). Подсказки в композере — тексты подобраны так, чтобы
 * реально попадать в сценарии мока (`core/agent/scenarios/index.ts`,
 * докс SCENARIOS.md §3), а не быть декоративными ярлыками, за которыми
 * ничего не стоит.
 *
 * Пять навыков нарочно бьют в пять разных сценариев — портфельное
 * сканирование с прогрессом, короткий разбор письма, утренний дайджест,
 * уточняющий вопрос и честная ошибка внешнего сервиса — так одно
 * пространство демонстрирует весь спектр поведения мока, а не только
 * happy path.
 */
import { MailQuestion, Repeat, Search, Split, Sunrise } from 'lucide-react';
import type { AgentSkill } from '@/workspaces/types';

export const obligationsSkills: AgentSkill[] = [
  {
    id: 'obl-renewals',
    label: 'Автопролонгации в портфеле',
    prompt: 'Какие договоры продлятся автоматически?',
    icon: Repeat,
  },
  {
    id: 'obl-vektor-price',
    label: 'Письмо о повышении цены',
    prompt: 'Проверить письмо контрагента о повышении цены',
    icon: MailQuestion,
  },
  {
    id: 'obl-digest',
    label: 'Утренний дайджест',
    prompt: 'Собери дайджест по обязательствам за сегодня',
    icon: Sunrise,
  },
  {
    id: 'obl-clarify-termination',
    label: 'Уточнить, какой договор расторгаем',
    prompt: 'Хотим расторгнуть один из договоров',
    icon: Split,
  },
  {
    id: 'obl-egrul',
    label: 'Проверить контрагента по ЕГРЮЛ',
    prompt: 'Запроси выписку из ЕГРЮЛ по контрагенту перед продлением',
    icon: Search,
  },
];
