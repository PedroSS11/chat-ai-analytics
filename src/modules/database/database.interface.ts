import { SqlStatement } from './sql/load-sql';

export interface DatabaseServiceInterface {
  select<T = Record<string, unknown>>(
    statement: SqlStatement,
    params: object,
  ): Promise<T[]>;
}
