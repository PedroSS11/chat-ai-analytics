import { ChatCompletionTool } from 'openai/resources.js';
import { PAYABLE_OPERATIONS } from '../analytics/payable-accounts';

export const CONSULTAR_CONTAS_PAGAR_TOOL = 'consultar_contas_pagar';

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: CONSULTAR_CONTAS_PAGAR_TOOL,
      description:
        'Consulta indicadores de contas a pagar do módulo financeiro.',
      parameters: {
        type: 'object',
        properties: {
          operacao: {
            type: 'string',
            enum: [...PAYABLE_OPERATIONS],
          },
          dataInicial: { type: 'string' },
          dataFinal: { type: 'string' },
        },
        required: ['operacao', 'dataInicial', 'dataFinal'],
        additionalProperties: false,
      },
    },
  },
];
