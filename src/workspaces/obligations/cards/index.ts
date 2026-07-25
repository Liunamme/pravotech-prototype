import type { CardTypeDef } from '@/workspaces/types';
import { renewalNoticeCardType } from './renewalNotice';
import { obligationBreachCardType } from './obligationBreach';
import { paymentDueCardType } from './paymentDue';

export { renewalNoticeCardType } from './renewalNotice';
export { obligationBreachCardType } from './obligationBreach';
export { paymentDueCardType } from './paymentDue';
export type { PaymentDuePayload } from './paymentDue';

/** Единственное допустимое `any` — гетерогенный реестр (docs/DOMAIN.md §8). */
export const obligationsCardTypes: CardTypeDef<any>[] = [
  renewalNoticeCardType,
  obligationBreachCardType,
  paymentDueCardType,
];
