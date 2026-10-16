import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, QueryValues } from 'mysql2/promise';
import { DatabaseServiceInterface } from './database.interface';

type SqlStatement = { sql: string };

@Injectable()
export class DatabaseMySqlService
  implements DatabaseServiceInterface, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const port = config.get<string>('MYSQL_PORT');

    this.pool = createPool({
      host: config.get<string>('MYSQL_HOST'),
      port: port ? Number(port) : undefined,
      user: config.get<string>('MYSQL_USER'),
      password: config.get<string>('MYSQL_PASSWORD'),
      database: config.get<string>('MYSQL_DATABASE'),
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  private validateParams(params: object): QueryValues {
    return {};
  }

  private buildFullStatement(sql: string): string {
    // COLOCAR OS WHERE
    

    return sql;
  }

  async select<T = Record<string, unknown>>(
    statement: SqlStatement,
    params: object,
  ): Promise<T[]> {
    const values = this.validateParams(params);
    const statementCompletion = this.buildFullStatement(statement.sql);

    const [rows] = await this.pool.query(statementCompletion, values);
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
