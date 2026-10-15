import { ChatCompletionTool } from 'openai/resources.js';
import { PAYABLE_OPERATIONS } from '../analytics/payable-accounts';

export const CONSULTAR_CONTAS_PAGAR_TOOL = 'consultar_contas_pagar';

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: CONSULTAR_CONTAS_PAGAR_TOOL,
      description: 'Consulta indicadores de orçamentos.',
      parameters: {
        type: 'object',
        properties: {
          operacao: {
            type: 'string',
            enum: [...PAYABLE_OPERATIONS],
            description: 'Indicador pedido: media, soma ou quantidade.',
          },
          dataInicial: {
            type: 'string',
            description:
              'Início do período, YYYY-MM-DD. Para um mês, use o primeiro dia.',
          },
          dataFinal: {
            type: 'string',
            description:
              'Fim do período, YYYY-MM-DD. Para um mês, use o último dia.',
          },
          limite: {
            type: 'integer',
            description:
              'Quantidade de linhas quando pedirem os N primeiros. Omita se não houver limite.',
          },
        },
        required: ['operacao', 'dataInicial', 'dataFinal'],
        additionalProperties: false,
      },
    },
  },
];
