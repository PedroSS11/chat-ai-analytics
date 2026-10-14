import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiToolExecutor } from './ai-tool.executor';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [AiController],
  providers: [AiService, AiToolExecutor],
})
export class AiModule {}
