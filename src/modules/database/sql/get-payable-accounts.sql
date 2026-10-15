SELECT *
FROM budgets b
WHERE b.createdAt >= :dataInicial
  AND b.createdAt <= :dataFinal
ORDER BY b.createdAt
LIMIT :limite
