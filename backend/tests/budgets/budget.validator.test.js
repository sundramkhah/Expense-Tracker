import test from 'node:test';
import assert from 'node:assert/strict';
import { createBudgetSchema } from '../../src/modules/budgets/budget.validator.js';

test('budget validation requires a YYYY-MM month', () => {
  assert.equal(createBudgetSchema.safeParse({ category: 'Food', limit: 5000, month: '2026-09' }).success, true);
  assert.equal(createBudgetSchema.safeParse({ category: 'Food', limit: 5000, month: 'September' }).success, false);
});
