import test from 'node:test';
import assert from 'node:assert/strict';
import { missingProfileFields } from '../src/utils/userProfile.js';
import { notificationDetails } from '../src/utils/notificationDetails.js';

const user = { displayName: 'Alex', email: 'alex@example.test', emailVerified: true };

test('Google login creates the full public profile for a new user', () => {
  const fields = missingProfileFields(user, {}, 'timestamp');
  assert.deepEqual(fields, { name: 'Alex', email: user.email, role: 'public', isEmailVerified: true, createdAt: 'timestamp' });
});

test('Google login repairs a profile previously created only by push registration', () => {
  const existing = { email: user.email, expoPushToken: 'existing-token' };
  const merged = { ...existing, ...missingProfileFields(user, existing) };
  assert.equal(merged.role, 'public');
  assert.equal(merged.name, 'Alex');
  assert.equal(merged.expoPushToken, 'existing-token');
});

test('Google login preserves an existing vet role and account details', () => {
  const existing = { name: 'Dr Alex', email: 'vet@example.test', role: 'vet', isEmailVerified: true, createdAt: 'original', expoPushToken: 'token' };
  assert.deepEqual(missingProfileFields(user, existing), {});
});

test('medical and event notifications show their own content, without a sighting map', () => {
  for (const type of ['health_update', 'event_update']) {
    assert.deepEqual(notificationDetails({ type, title: 'Update', message: 'Full details', latitude: 0, longitude: 0 }), { title: 'Update', message: 'Full details' });
  }
});

test('a sighting on the equator or prime meridian retains zero coordinates', () => {
  const details = notificationDetails({ type: 'sighting', latitude: 0, longitude: 0 });
  assert.match(details.message, /Latitude: 0\nLongitude: 0/);
  assert.equal(new URL(details.mapUrl).searchParams.get('query'), '0,0');
});

test('missing or invalid sighting coordinates never produce a broken map link', () => {
  for (const coords of [{}, { latitude: null, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 6, longitude: Infinity }]) {
    assert.equal(notificationDetails({ type: 'sighting', ...coords }).mapUrl, undefined);
  }
});
