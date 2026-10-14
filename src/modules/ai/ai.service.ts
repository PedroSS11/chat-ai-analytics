import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiToolExecutor } from './ai-tool.executor';
import { AI_TOOLS } from './ai.tools';

const SYSTEM_PROMPT = `
Você é um assistente de análise de dados.
Responda usando somente os dados autorizados do sistema.
Use as ferramentas disponíveis para consultar indicadores.
`;

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiToolExecutor: AiToolExecutor,
    config: ConfigService,
  ) {
    this.model = config.getOrThrow<string>('AI_MODEL');
    this.client = new OpenAI({
      baseURL: config.get<string>('AI_BASE_URL'),
      apiKey: config.get<string>('AI_API_KEY'),
    });
  }

  async ask(question: string) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      tools: AI_TOOLS,
    });

    const toolCall = response.choices[0]?.message.tool_calls?.[0];
    this.logger.debug(toolCall);

    if (!toolCall || toolCall.type !== 'function') {
      return;
    }

    return this.aiToolExecutor.execute(
      toolCall.function.name,
      toolCall.function.arguments,
    );
  }
}
