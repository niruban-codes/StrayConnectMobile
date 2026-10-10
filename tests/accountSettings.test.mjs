import test from 'node:test';
import assert from 'node:assert/strict';
import { profileChanges, validatePasswordChange, AVATAR_IDS } from '../src/utils/accountSettings.js';

test('profile edits trim names, support all avatars, and exclude account privileges', () => {
  for (const avatar of AVATAR_IDS) assert.deepEqual(profileChanges('  Rescue Friend  ', avatar), { name: 'Rescue Friend', avatarId: avatar });
  assert.throws(() => profileChanges('   ', 'dog'));
  assert.throws(() => profileChanges('a'.repeat(41), 'dog'));
  assert.throws(() => profileChanges('Friend', 'unknown'));
});
test('password changes require current password, matching strong replacement, and a changed value', () => {
  assert.doesNotThrow(() => validatePasswordChange('OldPass1!', 'NewPass2!', 'NewPass2!'));
  for (const args of [ ['', 'NewPass2!', 'NewPass2!'], ['OldPass1!', 'NewPass2!', 'Different3!'], ['OldPass1!', 'short', 'short'], ['OldPass1!', 'OldPass1!', 'OldPass1!'] ]) {
    assert.throws(() => validatePasswordChange(...args));
  }
});
