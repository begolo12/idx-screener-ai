import test from 'node:test';
import assert from 'node:assert/strict';
import { isDbConfigured } from '../src/lib/db-check.mjs';

test('isDbConfigured returns false when DATABASE_URL is empty', () => {
  const configured = isDbConfigured('');
  assert.equal(configured, false);
});

test('isDbConfigured returns true when postgres url is provided', () => {
  const configured = isDbConfigured('postgres://user:pass@ep-cool.neon.tech/neondb');
  assert.equal(configured, true);
});
