import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import oracledb from 'oracledb';
import { DatabaseServiceInterface } from './database.interface';
import { compileQuery, SqlStatement } from './sql/load-sql';

@Injectable()
export class DatabaseOracleService
  implements DatabaseServiceInterface, OnModuleInit, OnModuleDestroy
{
  private pool?: Awaited<ReturnType<typeof oracledb.createPool>>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.pool = await oracledb.createPool({
      user: this.config.getOrThrow<string>('ORACLE_USER'),
      password: this.config.getOrThrow<string>('ORACLE_PASSWORD'),
      connectString: this.config.getOrThrow<string>('ORACLE_CONNECT_STRING'),
    });
  }

  async select<T = Record<string, unknown>>(
    statement: SqlStatement,
    params: object,
  ): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Pool Oracle ainda não iniciado');
    }

    const { sql, namedBinds } = compileQuery(statement, params, 'oracle');
    const connection = await this.pool.getConnection();

    try {
      const result = await connection.execute(sql, namedBinds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return (result.rows ?? []) as T[];
    } finally {
      await connection.close();
    }
  }

  async onModuleDestroy() {
    await this.pool?.close();
  }
}
