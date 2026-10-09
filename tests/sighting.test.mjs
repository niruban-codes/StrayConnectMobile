import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { database } from './transactionHarness.mjs';
import { validCoordinate, placeCoordinate, saveSighting } from '../src/utils/sighting.js';
const pet = { id: 'pet' }, sighting = { id: 'sighting' }, notice = { id: 'notice' };
const payload = { latitude: 6.92, longitude: 79.86, notes: 'Near the gate' };
const run = (db, fail = false) => db.run(tx => saveSighting(tx, pet, sighting, notice, payload, { uid: 'reporter' }, 'now'), fail);

test('coordinates reject malformed locations and accept zero', () => {
  assert.equal(validCoordinate({ latitude: 0, longitude: 0 }), true);
  for (const point of [null, {}, { latitude: '6', longitude: 79 }, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) assert.equal(validCoordinate(point), false);
  assert.equal(placeCoordinate({ geometry: {} }), null);
  assert.deepEqual(placeCoordinate({ geometry: { location: { lat: 0, lng: 0 } } }), { latitude: 0, longitude: 0 });
});
test('sighting and notification save atomically, and retry is idempotent', async () => {
  const db = database({ pet: { status: 'lost', ownerId: 'owner', name: 'Rex' } });
  await assert.rejects(run(db, true));
  assert.equal(db.docs.sighting, undefined);
  assert.equal(db.docs.notice, undefined);
  assert.equal(await run(db), true);
  const saved = structuredClone(db.docs);
  assert.equal(await run(db), true);
  assert.deepEqual(db.docs, saved);
  assert.equal(db.docs.notice.userId, 'owner');
  assert.equal(db.docs.sighting.notes, 'Near the gate');
});
test('simultaneous submissions with the same ID create one sighting notification', async () => {
  const db = database({ pet: { status: 'lost', ownerId: 'owner' } });
  await Promise.all([run(db), run(db)]);
  assert.equal(Object.keys(db.docs).length, 3);
});
test('uses the current owner and rejects animals no longer missing', async () => {
  const db = database({ pet: { status: 'lost', ownerId: 'new-owner' } });
  await run(db);
  assert.equal(db.docs.notice.userId, 'new-owner');
  for (const status of ['owned', 'adopted', 'archived']) {
    const closed = database({ pet: { status } });
    await assert.rejects(run(closed), /no longer listed/);
    assert.equal(closed.docs.sighting, undefined);
  }
});
test('missing owner does not falsely claim an owner notification', async () => {
  const db = database({ pet: { status: 'lost' } });
  assert.equal(await run(db), false);
  assert.equal(db.docs.notice, undefined);
});
test('signed-out users cannot submit sightings', async () => {
  const db = database({ pet: { status: 'lost' } });
  await assert.rejects(db.run(tx => saveSighting(tx, pet, sighting, notice, payload, null, 'now')), /sign in/);
});
test('native configuration uses the dedicated Maps key and retains other config', () => {
  const config = createRequire(import.meta.url)('../app.config.js');
  const previous = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  process.env.GOOGLE_MAPS_ANDROID_API_KEY = 'test-maps-key';
  try {
    const result = config({ config: { name: 'App', android: { package: 'test.app', permissions: ['CUSTOM'] } } });
    assert.equal(result.android.config.googleMaps.apiKey, 'test-maps-key');
    assert.equal(result.android.package, 'test.app');
    assert.ok(result.android.permissions.includes('android.permission.ACCESS_FINE_LOCATION'));
    assert.ok(result.android.permissions.includes('CUSTOM'));
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    else process.env.GOOGLE_MAPS_ANDROID_API_KEY = previous;
  }
});

test('owner reporting their own pet gets one notification with the selected location', async () => {
  const db = database({ pet: { status: 'lost', ownerId: 'reporter', name: 'Rex' } });
  assert.equal(await run(db), true);
  assert.equal(db.docs.notice.userId, 'reporter');
  assert.equal(db.docs.notice.type, 'sighting');
  assert.equal(db.docs.notice.latitude, payload.latitude);
  assert.equal(db.docs.notice.longitude, payload.longitude);
  assert.equal(db.docs.notice.isRead, false);
  const original = structuredClone(db.docs.notice);
  assert.equal(await run(db), true);
  assert.deepEqual(db.docs.notice, original);
  assert.equal(Object.keys(db.docs).length, 3);
});
