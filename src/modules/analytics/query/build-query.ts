import { BadRequestException } from '@nestjs/common';
import {
  AnalyticalFilter,
  AnalyticalQuery,
} from '../../database/sql/analytical-query';
import { findSource, SOURCES } from '../catalog';
import { OPERATIONS, Operation, SourceCatalog } from '../catalog/source';
import { PERIOD_TYPES, resolvePeriod } from './period';

const RESERVED = new Set([
  'fonte',
  'operacao',
  'metrica',
  'agruparPor',
  'periodoTipo',
  'dataInicial',
  'dataFinal',
  'quantidadePeriodos',
  'limite',
  'ultimosRegistros',
]);

export function buildAnalyticalQuery(
  input: unknown,
  now = new Date(),
): AnalyticalQuery {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('Parâmetros da consulta inválidos');
  }

  const raw = input as Record<string, unknown>;
  const source = findSource(readFonte(raw.fonte));
  if (!source) {
    throw new BadRequestException(
      `Fonte não disponível. Use: ${SOURCES.map((item) => item.name).join(', ')}`,
    );
  }

  const operation = readEnum(raw.operacao, 'operacao', OPERATIONS);
  if (!source.operations.includes(operation)) {
    throw new BadRequestException(
      `Operação não disponível em ${source.name}. Use: ${source.operations.join(', ')}`,
    );
  }

  const measures = readMeasures(raw.metrica, operation, source);

  const groupName = optionalString(raw.agruparPor);
  let groupByColumn: string | undefined;
  let groupByPeriod = false;
  if (groupName === 'periodo') {
    groupByPeriod = true;
  } else if (groupName) {
    const dimension = source.dimensions.find((item) => item.name === groupName);
    if (!dimension) {
      throw new BadRequestException(
        `Agrupamento não disponível em ${source.name}. Use: periodo, ${source.dimensions.map((item) => item.name).join(', ')}`,
      );
    }
    groupByColumn = dimension.column;
  }

  const filters: AnalyticalFilter[] = source.dimensions.flatMap((dimension) => {
    const values = readFilter(raw[dimension.name], dimension.name);
    if (!values) {
      return [];
    }
    return [{ column: dimension.column, op: 'in' as const, value: values }];
  });

  for (const key of Object.keys(raw)) {
    if (
      RESERVED.has(key) ||
      source.dimensions.some((item) => item.name === key)
    ) {
      continue;
    }
    throw new BadRequestException(`Filtro não permitido: ${key}`);
  }

  const periodoTipo = optionalEnum(
    raw.periodoTipo,
    'periodoTipo',
    PERIOD_TYPES,
  );
  if (periodoTipo) {
    const period = resolvePeriod(
      {
        periodoTipo,
        dataInicial: optionalString(raw.dataInicial),
        dataFinal: optionalString(raw.dataFinal),
        quantidadePeriodos: optionalInteger(
          raw.quantidadePeriodos,
          'quantidadePeriodos',
        ),
      },
      now,
    );
    filters.push(
      { column: source.dateColumn, op: 'gte', value: period.dataInicial },
      { column: source.dateColumn, op: 'lte', value: period.dataFinal },
    );
  }

  return {
    view: source.view,
    operation,
    measures,
    groupByColumn,
    groupByPeriod,
    dateColumn: source.dateColumn,
    filters,
    limit: optionalLimit(raw.limite),
    ultimosRegistros: optionalBounded(
      raw.ultimosRegistros,
      'ultimosRegistros',
      500,
    ),
  };
}

function readFonte(value: unknown) {
  const name =
    optionalString(value) ??
    (SOURCES.length === 1 ? SOURCES[0].name : undefined);
  if (!name) {
    throw new BadRequestException(
      `fonte é obrigatório. Use: ${SOURCES.map((item) => item.name).join(', ')}`,
    );
  }
  return name;
}

function readMeasures(
  value: unknown,
  operation: Operation,
  source: SourceCatalog,
) {
  if (operation === 'quantidade') {
    return [];
  }

  const names = Array.isArray(value) ? value : value == null ? [] : [value];
  if (
    names.length === 0 ||
    names.some((item) => typeof item !== 'string' || item.trim() === '')
  ) {
    throw new BadRequestException(
      `Informe metrica. Use: ${source.measures.map((item) => item.name).join(', ')}`,
    );
  }

  return names.map((name) => {
    const measure = source.measures.find((item) => item.name === name);
    if (!measure) {
      throw new BadRequestException(
        `Métrica não disponível em ${source.name}. Use: ${source.measures.map((item) => item.name).join(', ')}`,
      );
    }
    return { name: measure.name, column: measure.column };
  });
}

function readFilter(value: unknown, name: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const items = Array.isArray(value) ? value : [value];
  if (
    items.length === 0 ||
    items.some((item) => typeof item !== 'string' && typeof item !== 'number')
  ) {
    throw new BadRequestException(
      `${name} precisa ser texto ou lista de textos`,
    );
  }

  const values = items.filter((item) => item !== '');
  return values.length > 0 ? values : undefined;
}

function optionalLimit(value: unknown) {
  return optionalBounded(value, 'limite', 100);
}

function optionalBounded(value: unknown, name: string, max: number) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = optionalInteger(value, name);
  if (parsed === undefined || parsed < 1 || parsed > max) {
    throw new BadRequestException(
      `${name} precisa ser um inteiro de 1 a ${max}`,
    );
  }

  return parsed;
}

function optionalInteger(value: unknown, name: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`${name} precisa ser um inteiro`);
  }
  return value;
}

function readString(value: unknown, name: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${name} é obrigatório`);
  }
  return value;
}

function optionalString(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value;
}

function readEnum<T extends string>(
  value: unknown,
  name: string,
  allowed: readonly T[],
): T {
  const text = readString(value, name);
  if (!allowed.includes(text as T)) {
    throw new BadRequestException(
      `${name} inválido. Use: ${allowed.join(', ')}`,
    );
  }
  return text as T;
}

function optionalEnum<T extends string>(
  value: unknown,
  name: string,
  allowed: readonly T[],
): T | undefined {
  const text = optionalString(value);
  if (!text) {
    return undefined;
  }
  if (!allowed.includes(text as T)) {
    throw new BadRequestException(
      `${name} inválido. Use: ${allowed.join(', ')}`,
    );
  }
  return text as T;
}
