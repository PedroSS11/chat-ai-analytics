import { ChatCompletionTool } from 'openai/resources.js';
import { SOURCES } from '../analytics/catalog';
import { OPERATIONS } from '../analytics/catalog/source';
import { PERIOD_TYPES } from '../analytics/query/period';

export const CONSULTAR_TOOL = 'consultar';

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: CONSULTAR_TOOL,
      description: SOURCES.map(describeSource).join('\n'),
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['fonte', 'operacao'],
        properties: {
          fonte: {
            type: 'string',
            enum: SOURCES.map((source) => source.name),
            description: 'Assunto da pergunta.',
          },
          operacao: {
            type: 'string',
            enum: [...OPERATIONS],
            description:
              'soma e media exigem metrica. quantidade conta as linhas da view.',
          },
          metrica: {
            type: 'array',
            items: {
              type: 'string',
              enum: unique(
                SOURCES.flatMap((source) =>
                  source.measures.map((item) => item.name),
                ),
              ),
            },
            description:
              'Uma ou mais métricas. Para média de quantidade e valor, envie as duas.',
          },
          agruparPor: {
            type: 'string',
            enum: [
              'periodo',
              ...unique(
                SOURCES.flatMap((source) =>
                  source.dimensions.map((item) => item.name),
                ),
              ),
            ],
            description:
              'periodo agrupa por mês. cliente ou regiao agrupam por esse campo. Use limite para os N primeiros grupos.',
          },
          periodoTipo: {
            type: 'string',
            enum: [...PERIOD_TYPES],
            description:
              'intervalo usa dataInicial e dataFinal. ultimos_meses e proximos_periodos usam quantidadePeriodos. Omita se a pergunta não tiver período.',
          },
          dataInicial: {
            type: 'string',
            description:
              'Início inclusive, YYYY-MM-DD. Mês sem ano usa o ano atual.',
          },
          dataFinal: {
            type: 'string',
            description: 'Fim inclusive, YYYY-MM-DD.',
          },
          quantidadePeriodos: {
            type: 'integer',
            description:
              'Número de meses em ultimos_meses ou proximos_periodos.',
          },
          limite: {
            type: 'integer',
            description:
              'Quantidade de grupos quando pedirem os N primeiros de um agrupamento.',
          },
          ultimosRegistros: {
            type: 'integer',
            description:
              'Use para os N últimos registros, como os 50 últimos orçamentos. Não combine com agruparPor nem limite.',
          },
          ...filterProperties(),
        },
      },
    },
  },
];

function describeSource(source: (typeof SOURCES)[number]) {
  const measures = source.measures.map((item) => item.name).join(', ');
  const dimensions = source.dimensions.map((item) => item.name).join(', ');
  return `${source.name}: ${source.description} Métricas: ${measures}. Filtros: ${dimensions}.`;
}

function filterProperties() {
  return Object.fromEntries(
    uniqueFields().map((field) => [
      field.name,
      {
        type: 'array',
        items: { type: 'string' },
        description: field.description,
      },
    ]),
  );
}

function uniqueFields() {
  const seen = new Set<string>();
  return SOURCES.flatMap((source) => source.dimensions).filter((field) => {
    if (seen.has(field.name)) {
      return false;
    }
    seen.add(field.name);
    return true;
  });
}

function unique(values: string[]) {
  return [...new Set(values)];
}
