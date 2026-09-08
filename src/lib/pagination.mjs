export function paginateItems(items, page = 1, limit = 20) {
  const validPage = Math.max(1, Number(page) || 1);
  const validLimit = Math.max(1, Number(limit) || 20);
  const total = items.length;
  const totalPages = Math.ceil(total / validLimit) || 1;
  const start = (validPage - 1) * validLimit;
  const data = items.slice(start, start + validLimit);

  return {
    data,
    page: validPage,
    limit: validLimit,
    total,
    totalPages,
  };
}
