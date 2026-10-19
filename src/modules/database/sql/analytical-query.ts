export type AggregateOperation = 'soma' | 'media' | 'quantidade';

export type AnalyticalFilter = {
  column: string;
  op: 'eq' | 'in' | 'gte' | 'lte';
  value: SqlValue | SqlValue[];
};

export type SqlValue = string | number;

export type QueryMeasure = {
  name: string;
  column: string;
};

export type AnalyticalQuery = {
  view: string;
  operation: AggregateOperation;
  measures: QueryMeasure[];
  groupByColumn?: string;
  groupByPeriod: boolean;
  dateColumn: string;
  filters: AnalyticalFilter[];
  limit?: number;
  ultimosRegistros?: number;
};

export type CompiledQuery = {
  sql: string;
  values: SqlValue[];
  namedBinds: Record<string, SqlValue>;
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function compileAnalyticalQuery(
  query: AnalyticalQuery,
  dialect: 'mysql' | 'oracle',
): CompiledQuery {
  assertIdentifier(query.view, 'View');
  assertIdentifier(query.dateColumn, 'Data');

  const values: SqlValue[] = [];
  const namedBinds: Record<string, SqlValue> = {};
  let bindIndex = 0;
  const bind = (value: SqlValue) => {
    if (dialect === 'mysql') {
      values.push(value);
      return '?';
    }

    const key = `p${bindIndex}`;
    bindIndex += 1;
    namedBinds[key] = value;
    return `:${key}`;
  };

  const alias = query.ultimosRegistros ? 'src' : 't';
  const selectParts: string[] = [];
  const groupParts: string[] = [];

  if (query.groupByPeriod) {
    const period = periodExpression(query.dateColumn, dialect, alias);
    selectParts.push(`${period} AS periodo`);
    groupParts.push(period);
  } else if (query.groupByColumn) {
    assertIdentifier(query.groupByColumn, 'Agrupamento');
    selectParts.push(
      `${alias}.${query.groupByColumn} AS ${query.groupByColumn}`,
    );
    groupParts.push(`${alias}.${query.groupByColumn}`);
  }

  const aggregates = aggregateExpressions(query, alias);
  selectParts.push(...aggregates.map((item) => item.sql));

  const filters = query.filters.flatMap((filter) => {
    assertIdentifier(filter.column, 'Filtro');
    if (filter.op === 'in') {
      const items = (
        Array.isArray(filter.value) ? filter.value : [filter.value]
      ).filter((item) => item !== '');
      if (items.length === 0) {
        return [];
      }
      return [
        `t.${filter.column} IN (${items.map((item) => bind(item)).join(', ')})`,
      ];
    }

    const value = Array.isArray(filter.value) ? filter.value[0] : filter.value;
    const operator =
      filter.op === 'gte' ? '>=' : filter.op === 'lte' ? '<=' : '=';
    return [`t.${filter.column} ${operator} ${bind(value)}`];
  });

  const from = query.ultimosRegistros
    ? recentRows(query, dialect, filters, bind)
    : `${query.view} t`;
  let sql = `SELECT ${selectParts.join(', ')} FROM ${from}`;
  if (!query.ultimosRegistros && filters.length > 0) {
    sql += ` WHERE ${filters.join(' AND ')}`;
  }
  if (groupParts.length > 0) {
    sql += ` GROUP BY ${groupParts.join(', ')}`;
    const order = query.groupByPeriod
      ? 'periodo ASC'
      : `${aggregates[0]?.alias ?? query.operation} DESC`;
    sql += ` ORDER BY ${order}`;
  }
  if (query.limit && groupParts.length > 0) {
    sql += limitClause(dialect, bind(query.limit));
  }

  return { sql, values, namedBinds };
}

function recentRows(
  query: AnalyticalQuery,
  dialect: 'mysql' | 'oracle',
  filters: string[],
  bind: (value: SqlValue) => string,
) {
  const columns = new Set<string>([query.dateColumn]);
  for (const measure of query.measures) {
    columns.add(measure.column);
  }
  if (query.groupByColumn) {
    columns.add(query.groupByColumn);
  }

  let inner = `SELECT ${[...columns].join(', ')} FROM ${query.view}`;
  if (filters.length > 0) {
    inner += ` WHERE ${filters.join(' AND ').replaceAll('t.', '')}`;
  }
  inner += ` ORDER BY ${query.dateColumn} DESC${limitClause(dialect, bind(query.ultimosRegistros ?? 0))}`;
  return `(${inner}) src`;
}

function limitClause(dialect: 'mysql' | 'oracle', placeholder: string) {
  return dialect === 'oracle'
    ? ` FETCH FIRST ${placeholder} ROWS ONLY`
    : ` LIMIT ${placeholder}`;
}

function aggregateExpressions(query: AnalyticalQuery, alias: string) {
  if (query.operation === 'quantidade') {
    return [{ sql: 'COUNT(*) AS quantidade', alias: 'quantidade' }];
  }

  if (query.measures.length === 0) {
    throw new Error('Métrica ausente');
  }

  const fn = query.operation === 'soma' ? 'SUM' : 'AVG';
  return query.measures.map((measure) => {
    assertIdentifier(measure.column, 'Métrica');
    assertIdentifier(measure.name, 'Métrica');
    const name = `${query.operation}_${measure.name}`;
    return {
      sql: `${fn}(${alias}.${measure.column}) AS ${name}`,
      alias: name,
    };
  });
}

function periodExpression(
  column: string,
  dialect: 'mysql' | 'oracle',
  alias: string,
) {
  if (dialect === 'mysql') {
    return `DATE_FORMAT(${alias}.${column}, '%Y-%m')`;
  }

  return `TO_CHAR(${alias}.${column}, 'YYYY-MM')`;
}

function assertIdentifier(value: string, label: string) {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`${label} inválido`);
  }
}
