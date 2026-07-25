import { Sparkles } from 'lucide-react';
import type { AgentSkill } from '@/workspaces/types';
import styles from './SkillSuggestions.module.css';

export type SkillSuggestionsProps = {
  skills: AgentSkill[];
  onPick: (prompt: string) => void;
};

/**
 * Подсказки навыков над полем ввода — показываются, пока тред пуст (ТЗ 4b.6).
 * Навыки приходят из манифеста пространства (`WorkspaceManifest.skills`) —
 * `ChatView` решает, какой набор подать для текущего `scope` (конкретное
 * пространство или сводный список на «Сегодня»). Здесь — только рендер.
 */
export function SkillSuggestions({ skills, onPick }: SkillSuggestionsProps) {
  if (skills.length === 0) return null;

  return (
    <div className={styles.root} role="list" aria-label="Подсказки навыков">
      {skills.map((skill) => {
        const Icon = skill.icon ?? Sparkles;
        return (
          <button
            key={skill.id}
            type="button"
            role="listitem"
            className={styles.chip}
            onClick={() => onPick(skill.prompt)}
          >
            <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
            {skill.label}
          </button>
        );
      })}
    </div>
  );
}
