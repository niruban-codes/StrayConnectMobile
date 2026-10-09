import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from './transactionHarness.mjs';
import { setPetMissing } from '../src/utils/missingPet.js';
import { applicationId, submitAdoption } from '../src/utils/adoptionApplication.js';
import { createVerificationRefresh } from '../src/utils/emailVerification.js';
const petRef = { id: 'pet' };
const user = { uid: 'applicant', emailVerified: true };
const fields = { message: 'A home', experience: 'Some', livingSituation: 'House' };
const apply = (db, applicant = user) => db.run(tx => submitAdoption(tx, petRef, { id: applicationId('pet', applicant.uid) }, applicant, fields, 'now'));
test('adopted and sheltered pets regain their original status after missing/found', async () => {
  for (const status of ['owned', 'adopted', 'sheltered']) {
    const db = database({ pet: { status, ownerId: 'owner', adoptedAt: 'original', medicalHistory: ['record'] } });
    await db.run(tx => setPetMissing(tx, petRef, 'owner', true, 'now'));
    await db.run(tx => setPetMissing(tx, petRef, 'owner', true, 'later'));
    assert.equal(db.docs.pet.statusBeforeLost, status);
    await db.run(tx => setPetMissing(tx, petRef, 'owner', false, 'found'));
    assert.equal(db.docs.pet.status, status);
    assert.equal(db.docs.pet.adoptedAt, 'original');
    assert.deepEqual(db.docs.pet.medicalHistory, ['record']);
  }
});
test('legacy missing adopted pets retain adoption status on recovery', async () => {
  const db = database({ pet: { status: 'lost', ownerId: 'owner', adoptedBy: 'owner' } });
  await db.run(tx => setPetMissing(tx, petRef, 'owner', false, 'now'));
  assert.equal(db.docs.pet.status, 'adopted');
});
test('missing/found rejects other users and archived passports', async () => {
  for (const pet of [{ status: 'owned', ownerId: 'other' }, { status: 'archived', ownerId: 'owner' }]) {
    const db = database({ pet });
    await assert.rejects(db.run(tx => setPetMissing(tx, petRef, 'owner', true, 'now')));
    assert.deepEqual(db.docs.pet, pet);
  }
});
test('simultaneous applications from one user create exactly one application', async () => {
  const db = database({ pet: { status: 'sheltered', isVerified: true } });
  const results = await Promise.allSettled([apply(db), apply(db)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(db.docs.pet.pendingAdoptionRequestIds.length, 1);
  assert.equal(Object.keys(db.docs).length, 2);
});
test('simultaneous different applicants both remain in the review registry', async () => {
  const db = database({ pet: { status: 'sheltered', isVerified: true } });
  await Promise.all([apply(db), apply(db, { ...user, uid: 'other' })]);
  assert.equal(db.docs.pet.pendingAdoptionRequestIds.length, 2);
});
test('adoption blocks unverified pets, self adoption, and unavailable animals', async () => {
  for (const pet of [{ status: 'sheltered' }, { status: 'sheltered', isVerified: true, ownerId: user.uid }, { status: 'lost', isVerified: true }]) {
    const db = database({ pet });
    await assert.rejects(apply(db));
    assert.equal(Object.keys(db.docs).length, 1);
  }
});
test('legacy application also prevents a duplicate', async () => {
  const db = database({ pet: { status: 'sheltered', isVerified: true }, legacy: { status: 'pending' } });
  await assert.rejects(db.run(tx => submitAdoption(tx, petRef, { id: 'new' }, user, fields, 'now', [{ id: 'legacy' }])), /already applied/);
});
test('email verification refresh updates claims and deduplicates concurrent checks', async () => {
  const account = { uid: 'user', emailVerified: false };
  let reloads = 0, tokens = 0;
  const refresh = createVerificationRefresh({ currentUser: () => account,
    reloadUser: async () => { reloads++; account.emailVerified = true; }, refreshToken: async () => { tokens++; } });
  const results = await Promise.all([refresh(), refresh()]);
  assert.equal(reloads, 1); assert.equal(tokens, 1);
  assert.ok(results.every(result => result.emailVerified));
});
test('verification refresh rejects account changes and recovers after network failure', async () => {
  let account = { uid: 'a', emailVerified: false }, fail = true;
  const refresh = createVerificationRefresh({ currentUser: () => account, reloadUser: async () => {
    if (fail) throw new Error('offline'); account = { uid: 'b' };
  }, refreshToken: async () => {} });
  await assert.rejects(refresh(), /offline/);
  fail = false;
  await assert.rejects(refresh(), /account changed/);
});
