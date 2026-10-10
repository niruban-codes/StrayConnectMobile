export const AVATAR_IDS = ['initial', 'dog', 'cat', 'bunny', 'cow', 'fox'];
export function profileChanges(name, avatarId) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) throw new Error('Enter a name between 1 and 40 characters.');
  if (!AVATAR_IDS.includes(avatarId)) throw new Error('Choose an avatar from the list.');
  return { name: trimmed, avatarId };
}
export function validatePasswordChange(current, next, confirmation) {
  if (!current) throw new Error('Enter your current password.');
  if (next !== confirmation) throw new Error('New passwords do not match.');
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(next)) {
    throw new Error('Use at least 8 characters with uppercase, lowercase, a number and a special character (@$!%*?&).');
  }
  if (current === next) throw new Error('Choose a password different from your current one.');
}
