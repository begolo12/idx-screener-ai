import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateItems } from '../src/lib/pagination.mjs';

test('paginateItems slices array correctly', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const page1 = paginateItems(items, 1, 3);
  assert.deepEqual(page1.data, [1, 2, 3]);
  assert.equal(page1.totalPages, 4);

  const page4 = paginateItems(items, 4, 3);
  assert.deepEqual(page4.data, [10]);
});
