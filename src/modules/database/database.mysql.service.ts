import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool } from 'mysql2/promise';
import { DatabaseServiceInterface } from './database.interface';
import { compileQuery, SqlStatement } from './sql/load-sql';

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

  async select<T = Record<string, unknown>>(
    statement: SqlStatement,
    params: object,
  ): Promise<T[]> {
    const { sql, values } = compileQuery(statement, params, 'mysql');
    console.log(sql);
    console.log(values);
    const [rows] = await this.pool.query(sql, values);
    console.log(rows[0]);
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
