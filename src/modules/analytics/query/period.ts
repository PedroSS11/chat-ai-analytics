import { BadRequestException } from '@nestjs/common';

export const PERIOD_TYPES = [
  'intervalo',
  'ultimos_meses',
  'proximos_periodos',
] as const;

export type PeriodType = (typeof PERIOD_TYPES)[number];

export type ResolvedPeriod = {
  dataInicial: string;
  dataFinal: string;
};

const MAX_PERIODS = 36;

export function resolvePeriod(
  input: {
    periodoTipo: PeriodType;
    dataInicial?: string;
    dataFinal?: string;
    quantidadePeriodos?: number;
  },
  now = new Date(),
): ResolvedPeriod {
  if (input.periodoTipo === 'intervalo') {
    const dataInicial = requiredDate(input.dataInicial, 'dataInicial');
    const dataFinal = requiredDate(input.dataFinal, 'dataFinal');
    if (dataInicial > dataFinal) {
      throw new BadRequestException(
        'dataInicial precisa ser anterior ou igual a dataFinal',
      );
    }
    return { dataInicial, dataFinal };
  }

  const quantidade = requiredCount(input.quantidadePeriodos);
  if (input.periodoTipo === 'ultimos_meses') {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (quantidade - 1),
      1,
    );
    return { dataInicial: formatDate(start), dataFinal: formatDate(now) };
  }

  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1 + quantidade, 0);
  return { dataInicial: formatDate(start), dataFinal: formatDate(end) };
}

function requiredDate(value: string | undefined, name: string) {
  if (!value) {
    throw new BadRequestException(`${name} é obrigatória no período intervalo`);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new BadRequestException(`${name} precisa estar em YYYY-MM-DD`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new BadRequestException(`${name} não é uma data válida`);
  }

  return value;
}

function requiredCount(value: number | undefined) {
  if (
    !Number.isInteger(value) ||
    value === undefined ||
    value < 1 ||
    value > MAX_PERIODS
  ) {
    throw new BadRequestException(
      `quantidadePeriodos precisa ser um inteiro de 1 a ${MAX_PERIODS}`,
    );
  }

  return value;
}

function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
