import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_TOKEN } from './database.token';
import { DatabaseMySqlService } from './database.mysql.service';

@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        if (config.get<string>('DB_DRIVER') === 'oracle') {
          const { DatabaseOracleService } =
            await import('./database.oracle.service');
          return new DatabaseOracleService(config);
        }

        return new DatabaseMySqlService(config);
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
