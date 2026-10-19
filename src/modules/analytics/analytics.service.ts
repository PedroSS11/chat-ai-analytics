import { Inject, Injectable } from '@nestjs/common';
import { DatabaseServiceInterface } from '../database/database.interface';
import { DATABASE_TOKEN } from '../database/database.token';
import { buildAnalyticalQuery } from './query/build-query';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_TOKEN)
    private readonly databaseService: DatabaseServiceInterface,
  ) {}

  async consultar(params: unknown) {
    return this.databaseService.query(buildAnalyticalQuery(params));
  }
}
