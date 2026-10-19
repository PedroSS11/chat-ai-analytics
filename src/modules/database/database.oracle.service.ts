import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import oracledb from 'oracledb';
import { DatabaseServiceInterface } from './database.interface';
import {
  AnalyticalQuery,
  compileAnalyticalQuery,
} from './sql/analytical-query';

@Injectable()
export class DatabaseOracleService
  implements DatabaseServiceInterface, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseOracleService.name);
  private pool?: Awaited<ReturnType<typeof oracledb.createPool>>;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.pool = await oracledb.createPool({
      user: this.config.getOrThrow<string>('ORACLE_USER'),
      password: this.config.getOrThrow<string>('ORACLE_PASSWORD'),
      connectString: this.config.getOrThrow<string>('ORACLE_CONNECT_STRING'),
    });
  }

  async query<T = Record<string, unknown>>(
    query: AnalyticalQuery,
  ): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Pool Oracle ainda não iniciado');
    }

    const { sql, namedBinds } = compileAnalyticalQuery(query, 'oracle');
    this.logger.debug(`${sql} ${JSON.stringify(namedBinds)}`);
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
