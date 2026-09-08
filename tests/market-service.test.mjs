import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortStocks } from '../src/lib/market-transform.mjs';

test('filterAndSortStocks sorts top gainers correctly', () => {
  const mockStocks = [
    { ticker: 'BBCA', price: 10000, changePct: 1.5, volume: 5000000 },
    { ticker: 'BBRI', price: 5000, changePct: 3.2, volume: 12000000 },
    { ticker: 'GOTO', price: 50, changePct: -2.0, volume: 80000000 },
  ];

  const gainers = filterAndSortStocks(mockStocks, { sort: 'gainers' });
  assert.equal(gainers[0].ticker, 'BBRI');
  assert.equal(gainers[1].ticker, 'BBCA');
});

test('filterAndSortStocks sorts top losers correctly', () => {
  const mockStocks = [
    { ticker: 'BBCA', price: 10000, changePct: 1.5, volume: 5000000 },
    { ticker: 'BBRI', price: 5000, changePct: 3.2, volume: 12000000 },
    { ticker: 'GOTO', price: 50, changePct: -2.0, volume: 80000000 },
  ];

  const losers = filterAndSortStocks(mockStocks, { sort: 'losers' });
  assert.equal(losers[0].ticker, 'GOTO');
});

test('filterAndSortStocks filters by price range', () => {
  const mockStocks = [
    { ticker: 'BBCA', price: 10000, changePct: 1.5, volume: 5000000 },
    { ticker: 'BBRI', price: 5000, changePct: 3.2, volume: 12000000 },
    { ticker: 'GOTO', price: 50, changePct: -2.0, volume: 80000000 },
  ];

  const filtered = filterAndSortStocks(mockStocks, { minPrice: 100, maxPrice: 6000 });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].ticker, 'BBRI');
});
