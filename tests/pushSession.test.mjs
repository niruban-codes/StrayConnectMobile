import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushSession } from '../src/utils/pushSession.js';
import { changePetStatus } from '../src/utils/petStatus.js';
import { database } from './transactionHarness.mjs';
test('logout waits for an in-flight registration, detaches, then signs out', async () => {
  const calls = [];
  let release;
  const session = createPushSession({
    async attach() { calls.push('attach'); await new Promise(resolve => { release = resolve; }); },
    async detach() { calls.push('detach'); }, async signOut() { calls.push('logout'); },
  });
  session.activate('a');
  const registration = session.register('a', 'token');
  await Promise.resolve();
  const logout = session.logout('a');
  const late = session.register('a', 'token');
  release(); await Promise.all([registration, logout, late]);
  assert.deepEqual(calls, ['attach', 'detach', 'logout']);
});
test('late registration for an old account cannot attach after account switch', async () => {
  const calls = [];
  const session = createPushSession({ attach: async uid => calls.push(uid), detach: async () => {}, signOut: async () => {} });
  session.activate('b');
  await session.register('a', 'token'); await session.register('b', 'token');
  assert.deepEqual(calls, ['b']);
});
test('failed token detach prevents logout and permits retry', async () => {
  let fail = true, signedOut = false;
  const session = createPushSession({ attach: async () => {}, detach: async () => { if (fail) throw new Error('offline'); }, signOut: async () => { signedOut = true; } });
  session.activate('a');
  await assert.rejects(session.logout('a'), /offline/);
  assert.equal(signedOut, false);
  fail = false; await session.logout('a');
  assert.equal(signedOut, true);
});
test('stale mobile actions cannot unarchive or change another owners passport', async () => {
  for (const pet of [{ status: 'archived', ownerId: 'a' }, { status: 'owned', ownerId: 'b' }]) {
    const db = database({ pet });
    await assert.rejects(db.run(tx => changePetStatus(tx, { id: 'pet' }, 'a', 'owned', { status: 'lost' })));
    assert.deepEqual(db.docs.pet, pet);
  }
});
