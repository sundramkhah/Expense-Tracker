import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransactionSchema } from '../../src/modules/transactions/transaction.validator.js';

test('transaction validation coerces a positive amount', () => {
  const result = createTransactionSchema.safeParse({ type: 'expense', amount: '25.50', category: 'Food', date: '2026-09-01' });
  assert.equal(result.success, true);
  assert.equal(result.data.amount, 25.5);
});

test('transaction validation rejects negative amounts', () => {
  assert.equal(createTransactionSchema.safeParse({ type: 'expense', amount: -1, category: 'Food', date: '2026-09-01' }).success, false);
});
