export const PAYABLE_OPERATIONS = ['media', 'soma', 'quantidade'] as const;

export type PayableOperation = (typeof PAYABLE_OPERATIONS)[number];

export type PayableAccountsQuery = {
  operacao: PayableOperation;
  dataInicial: string;
  dataFinal: string;
};
