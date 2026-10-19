import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiToolExecutor } from './ai-tool.executor';
import { AI_TOOLS, CONSULTAR_TOOL } from './ai.tools';

const MAX_TOOL_ROUNDS = 4;

function systemPrompt() {
  return `
Você é um assistente de análise de dados.
Chame a ferramenta consultar. Não escreva JSON na resposta.
Para soma ou media, preencha metrica com a lista de campos pedidos.
agruparPor só quando a pergunta separar por mês, cliente ou região.
periodoTipo só quando a pergunta citar um período.
Os N últimos registros vão em ultimosRegistros, sem agruparPor e sem limite.
Os N primeiros de um grupo vão em limite, junto com agruparPor.
Exemplo: média de quantidade e valor dos 50 últimos orçamentos =
operacao media, metrica ["quantidade","valor"], ultimosRegistros 50.
Datas de intervalo em YYYY-MM-DD. Mês sem ano usa ${new Date().getFullYear()}.
Depois da consulta, responda em português com os números retornados.
`;
}

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
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: question },
    ];
    let lastResult: unknown;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: AI_TOOLS,
      });
      const message = response.choices[0]?.message;
      if (!message) {
        return lastResult;
      }

      const toolCalls =
        message.tool_calls?.filter((call) => call.type === 'function') ?? [];
      this.logger.debug(toolCalls);
      if (toolCalls.length === 0) {
        const recovered = extractConsultArgs(message.content);
        if (!recovered) {
          return message.content ?? lastResult;
        }

        lastResult = await this.runTool(
          CONSULTAR_TOOL,
          JSON.stringify(recovered),
        );
        return this.phrase(question, lastResult);
      }

      messages.push(message);
      for (const call of toolCalls) {
        lastResult = await this.runTool(
          call.function.name,
          call.function.arguments,
        );
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(lastResult),
        });
      }
    }

    return lastResult;
  }

  private async phrase(question: string, result: unknown) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'Responda em português, em uma frase, usando somente os números abaixo. Não escreva JSON.',
        },
        {
          role: 'user',
          content: `${question}\n\nDados: ${JSON.stringify(result)}`,
        },
      ],
    });
    const content = response.choices[0]?.message.content;
    if (!content || extractConsultArgs(content)) {
      return result;
    }
    return content;
  }

  private async runTool(name: string, args: string) {
    try {
      return await this.aiToolExecutor.execute(name, args);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha na consulta';
      this.logger.warn(message);
      return { erro: message };
    }
  }
}

function extractConsultArgs(content: string | null | undefined) {
  if (!content) {
    return undefined;
  }

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? content).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(candidate.slice(start, end + 1));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }
    const record = parsed as Record<string, unknown>;
    if (
      !('operacao' in record) &&
      !('metrica' in record) &&
      !('fonte' in record)
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}
