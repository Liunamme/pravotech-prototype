/**
 * Точка расширения платформы (docs/DOMAIN.md, раздел 8).
 *
 * Ключевой инвариант: новое рабочее пространство = один манифест + сид,
 * ноль правок в ядре (`src/core/**`, `src/pages/**`). Все типы здесь
 * существуют, чтобы это было возможно — ядро работает только с этими
 * контрактами и никогда не импортирует конкретное пространство напрямую.
 */

import type { FC } from 'react';
import type { AppIcon } from '@/shared/ui/icons/AppIcons';
import type {
  ActionCard,
  CalendarEvent,
  Id,
  LegalDocument,
  Message,
  TaskEvent,
  Thread,
} from '@/types/domain';

/** Готовая подсказка агенту, подставляется в композер одним кликом. */
export type AgentSkill = {
  id: Id;
  /** 'Найти автопролонгации' */
  label: string;
  /** Текст, который подставляется в композер. */
  prompt: string;
  icon?: AppIcon;
};

/** Вкладка в контекстной панели пространства ('Договоры', 'Дела', 'События'). */
export type ContextTabDef = {
  id: string;
  label: string;
  icon: AppIcon;
  Component: FC<{ workspaceId: Id }>;
};

/**
 * Определение типа карточки действия. Реестр пространства сопоставляет
 * `ActionCard.type` с этим контрактом — только так UI знает, как отрисовать
 * и как исполнить конкретное предложение агента.
 */
export interface CardTypeDef<P = unknown> {
  type: string;
  /** 'Уведомление об отказе от пролонгации' */
  label: string;
  icon: AppIcon;
  /** Read-режим тела карточки. Хромировку (шапку, кнопки, diff) рисует ActionCardShell. */
  Body: FC<{ payload: P; card: ActionCard<P> }>;
  /** Форма режима «изменить». Нет формы — кнопка «Изменить» скрыта. */
  EditForm?: FC<{ payload: P; onChange: (next: P) => void }>;
  /** Подпись основной кнопки. По умолчанию 'Подтвердить'. */
  confirmLabel?: string;
  /** true → confirm-диалог вместо undo-тоста (необратимые действия). */
  destructive?: boolean;
  /** Что происходит после подтверждения. Мок отдаёт поток событий задачи. */
  execute: (payload: P, card: ActionCard<P>) => AsyncIterable<TaskEvent>;
}

/** Стартовые данные пространства — то, чем заполняется стор при загрузке. */
export type WorkspaceSeed = {
  documents: LegalDocument[];
  cards: ActionCard[];
  events: CalendarEvent[];
  threads: Thread[];
  messages: Message[];
};

/**
 * Манифест рабочего пространства — единственная точка, которую нужно
 * написать, чтобы добавить новое пространство в платформу.
 */
export interface WorkspaceManifest {
  id: Id;
  title: string;
  /** Короткое имя для рейки. */
  shortTitle: string;
  icon: AppIcon;
  /** Для пустых состояний и настроек. */
  description: string;
  contextTabs: ContextTabDef[];
  /** Единственное допустимое `any` — гетерогенный реестр типов карточек. */
  cardTypes: CardTypeDef<any>[];
  skills: AgentSkill[];
  seed: WorkspaceSeed;
}
