import type { CardTypeDef } from '@/workspaces/types';
import { hearingPrepCardType } from './hearingPrep';
import { evidenceRequestCardType } from './evidenceRequest';
import { filingDeadlineCardType } from './filingDeadline';

export { hearingPrepCardType } from './hearingPrep';
export { evidenceRequestCardType } from './evidenceRequest';
export { filingDeadlineCardType } from './filingDeadline';
export type { EvidenceRequestPayload, EvidenceRequestItem } from './evidenceRequest';

/** Единственное допустимое `any` — гетерогенный реестр (docs/DOMAIN.md §8). */
export const litigationCardTypes: CardTypeDef<any>[] = [
  hearingPrepCardType,
  evidenceRequestCardType,
  filingDeadlineCardType,
];
