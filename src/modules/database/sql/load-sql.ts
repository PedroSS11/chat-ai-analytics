import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type SqlBind = string | number | boolean | Date | null;

export type SqlStatement = {
  sql: string;
};

export type CompiledQuery = {
  sql: string;
  values: SqlBind[];
  namedBinds: Record<string, SqlBind>;
};

const BIND = /:([A-Za-z_][\w]*)/g;
const LIMIT_CLAUSE = /\s+LIMIT\s+:([A-Za-z_][\w]*)\s*$/i;

export function loadSqlStatement(filename: string): SqlStatement {
  const filePath = join(__dirname, filename);
  const sql = readFileSync(filePath, 'utf8').trim();
  if (!sql) {
    throw new Error('Arquivo SQL sem consulta');
  }

  return { sql };
}

export function compileQuery(
  statement: SqlStatement,
  params: object,
  dialect: 'mysql' | 'oracle',
): CompiledQuery {
  const source = params as Record<string, unknown>;
  let sql = applyLimit(
    statement.sql.trim().replace(/;+\s*$/, ''),
    source,
    dialect,
  );
  const values: SqlBind[] = [];
  const namedBinds: Record<string, SqlBind> = {};

  sql = sql.replace(BIND, (_match, name: string) => {
    const bind = requiredBind(source, name);
    if (dialect === 'mysql') {
      values.push(bind);
      return '?';
    }

    namedBinds[name] = bind;
    return `:${name}`;
  });

  return { sql, values, namedBinds };
}

function applyLimit(
  sql: string,
  params: Record<string, unknown>,
  dialect: 'mysql' | 'oracle',
) {
  const match = sql.match(LIMIT_CLAUSE);
  if (!match) {
    return sql;
  }

  const name = match[1];
  const value = params[name];
  if (value === undefined || value === null || value === '') {
    return sql.replace(LIMIT_CLAUSE, '');
  }

  if (dialect === 'oracle') {
    return sql.replace(LIMIT_CLAUSE, ` FETCH FIRST :${name} ROWS ONLY`);
  }

  return sql;
}

function requiredBind(params: Record<string, unknown>, name: string): SqlBind {
  const value = params[name];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Param ${name} não informado`);
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return value;
  }

  throw new Error(`Param ${name} não pode ir para o SQL`);
}
