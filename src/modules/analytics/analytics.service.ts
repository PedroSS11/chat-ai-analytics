import { Inject, Injectable } from '@nestjs/common';
import { DatabaseServiceInterface } from '../database/database.interface';
import { DATABASE_TOKEN } from '../database/database.token';
import { getPayableAccountsStatement } from '../database/sql/get-payable-accounts';
import { PayableAccountsQuery } from './payable-accounts';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_TOKEN)
    private readonly databaseService: DatabaseServiceInterface,
  ) {}

  async getPayableAccounts(params: PayableAccountsQuery) {
    return this.databaseService.select(getPayableAccountsStatement, params);
  }
}
