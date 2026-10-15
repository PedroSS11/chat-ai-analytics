import { loadSqlStatement } from './load-sql';

export const getPayableAccountsStatement = loadSqlStatement(
  'get-payable-accounts.sql',
);
