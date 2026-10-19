import { AnalyticalQuery } from './sql/analytical-query';

export interface DatabaseServiceInterface {
  query<T = Record<string, unknown>>(query: AnalyticalQuery): Promise<T[]>;
}
