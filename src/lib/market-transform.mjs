export function filterAndSortStocks(stocks, options = {}) {
  let result = [...stocks];

  if (typeof options.minPrice === 'number' && !isNaN(options.minPrice)) {
    result = result.filter(s => s.price >= options.minPrice);
  }
  if (typeof options.maxPrice === 'number' && !isNaN(options.maxPrice)) {
    result = result.filter(s => s.price <= options.maxPrice);
  }

  switch (options.sort) {
    case 'gainers':
      result.sort((a, b) => b.changePct - a.changePct);
      break;
    case 'losers':
      result.sort((a, b) => a.changePct - b.changePct);
      break;
    case 'volume':
      result.sort((a, b) => b.volume - a.volume);
      break;
    case 'turnover':
      result.sort((a, b) => (b.turnoverVal || 0) - (a.turnoverVal || 0));
      break;
    default:
      break;
  }

  return result;
}
