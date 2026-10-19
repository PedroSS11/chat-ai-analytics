import { SourceCatalog } from './source';

export const orcamentos: SourceCatalog = {
  name: 'orcamentos',
  description:
    'Orçamentos por cliente e região, com valor, quantidade e previsão de fechamento.',
  view: 'budgets',
  dateColumn: 'updated_at',
  dimensions: [
    {
      name: 'cliente',
      column: 'cliente',
      description: 'Clientes citados na pergunta.',
    },
    {
      name: 'regiao',
      column: 'regiao',
      description: 'Regiões citadas na pergunta.',
    },
  ],
  measures: [
    {
      name: 'valor',
      column: 'total',
      description: 'Valor do orçamento.',
    },
    {
      name: 'quantidade',
      column: 'quantity',
      description: 'Quantidade de itens do orçamento.',
    },
    {
      name: 'previsao',
      column: 'previsao',
      description: 'Valor previsto de fechamento.',
    },
  ],
  operations: ['soma', 'media', 'quantidade'],
};
