import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool } from 'mysql2/promise';
import { DatabaseServiceInterface } from './database.interface';
import {
  AnalyticalQuery,
  compileAnalyticalQuery,
} from './sql/analytical-query';

@Injectable()
export class DatabaseMySqlService
  implements DatabaseServiceInterface, OnModuleDestroy
{
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseMySqlService.name);

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

  async query<T = Record<string, unknown>>(
    query: AnalyticalQuery,
  ): Promise<T[]> {
    const { sql, values } = compileAnalyticalQuery(query, 'mysql');
    this.logger.debug(`SQL : ${sql} ${JSON.stringify(values)}`);
    const [rows] = await this.pool.query(sql, values);
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
