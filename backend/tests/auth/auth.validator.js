import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../../src/modules/auth/auth.validator.js';

test('registration accepts valid credentials', () => {
  assert.equal(registerSchema.safeParse({ username: 'person', password: 'secret12' }).success, true);
});

test('registration rejects short credentials', () => {
  assert.equal(registerSchema.safeParse({ username: 'ab', password: '123' }).success, false);
});
