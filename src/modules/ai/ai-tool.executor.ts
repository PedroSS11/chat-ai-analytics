import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { CONSULTAR_TOOL } from './ai.tools';

@Injectable()
export class AiToolExecutor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async execute(name: string, args: string) {
    if (name !== CONSULTAR_TOOL) {
      throw new BadRequestException('Ferramenta não permitida');
    }

    return this.analyticsService.consultar(parseArgs(args));
  }
}

function parseArgs(args: string): unknown {
  try {
    return JSON.parse(args) as unknown;
  } catch {
    throw new BadRequestException('Parâmetros da ferramenta inválidos');
  }
}
