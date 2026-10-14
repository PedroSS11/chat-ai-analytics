import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { PayableAccountsQuery } from '../analytics/payable-accounts';
import { CONSULTAR_CONTAS_PAGAR_TOOL } from './ai.tools';

@Injectable()
export class AiToolExecutor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async execute(name: string, args: string) {
    switch (name) {
      case CONSULTAR_CONTAS_PAGAR_TOOL: {
        const parsedArgs = JSON.parse(args) as PayableAccountsQuery;
        return await this.analyticsService.getPayableAccounts(parsedArgs);
      }
      default:
        throw new BadRequestException('Ferramenta não permitida');
    }
  }
}
