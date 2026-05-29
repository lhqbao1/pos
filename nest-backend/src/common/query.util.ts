export function getPagination(query: Record<string, unknown>) {
  const page = toNumber(query.page, 1);
  const pageSize = toNumber(query.pageSize, 100);

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}
