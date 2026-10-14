import { Injectable } from '@nestjs/common';
import { PayableAccountsQuery } from './payable-accounts';

@Injectable()
export class AnalyticsService {
  async getPayableAccounts(params: PayableAccountsQuery): Promise<void> {}
}
