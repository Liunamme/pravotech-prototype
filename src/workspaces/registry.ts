/**
 * Реестр рабочих пространств.
 *
 * Пространства подключаются **литеральным массивом** (решение зафиксировано в
 * docs/DOMAIN.md §8): не саморегистрацией через побочный эффект импорта —
 * та зависит от порядка импортов и невоспроизводима в тестах. `registerWorkspace`
 * ниже остаётся для тестов и dev-экспериментов, в продуктовом пути не вызывается.
 *
 * Реестр обязан корректно работать и на пустом наборе: страницы уровня 1
 * («Сегодня», рейка, настройки) не должны падать без единого пространства.
 *
 * ИНВАРИАНТ: это единственное место в проекте, знающее о конкретных
 * пространствах. `src/core/**` и `src/shared/**` импортируют только `registry`
 * и `types`, но никогда сами `obligations`/`litigation`.
 */

import type { Id } from '@/types/domain';
import type { CardTypeDef, WorkspaceManifest, WorkspaceSeed } from './types';
import { obligationsManifest } from './obligations';
import { litigationManifest } from './litigation';

export const workspaces: WorkspaceManifest[] = [obligationsManifest, litigationManifest];

/**
 * Регистрирует манифест пространства. Повторная регистрация того же `id`
 * заменяет предыдущий манифест (с предупреждением в dev) — удобно при HMR.
 */
export function registerWorkspace(manifest: WorkspaceManifest): void {
  const existingIndex = workspaces.findIndex((w) => w.id === manifest.id);
  if (existingIndex >= 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[workspaces] Пространство "${manifest.id}" уже зарегистрировано — заменяю манифест.`,
      );
    }
    workspaces[existingIndex] = manifest;
    return;
  }
  workspaces.push(manifest);
}

export function getWorkspace(id: Id): WorkspaceManifest | undefined {
  return workspaces.find((w) => w.id === id);
}

export function getCardType(workspaceId: Id, type: string): CardTypeDef | undefined {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return undefined;
  return workspace.cardTypes.find((c) => c.type === type);
}

export function getAllSeeds(): WorkspaceSeed[] {
  return workspaces.map((w) => w.seed);
}
