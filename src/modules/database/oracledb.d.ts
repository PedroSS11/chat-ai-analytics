declare module 'oracledb' {
  interface OraclePool {
    getConnection(): Promise<OracleConnection>;
    close(drainTime?: number): Promise<void>;
  }

  interface OracleConnection {
    execute(
      sql: string,
      binds: Record<string, unknown>,
      options?: { outFormat?: number },
    ): Promise<{ rows?: Record<string, unknown>[] }>;
    close(): Promise<void>;
  }

  interface OracleDb {
    OUT_FORMAT_OBJECT: number;
    createPool(config: {
      user?: string;
      password?: string;
      connectString?: string;
    }): Promise<OraclePool>;
  }

  const oracledb: OracleDb;
  export = oracledb;
}
