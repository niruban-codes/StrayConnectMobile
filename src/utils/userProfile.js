// Fill missing profile fields without resetting existing roles or push tokens.
export function missingProfileFields(user, existing = {}, createdAt = new Date()) {
  const defaults = {
    name: user.displayName || 'Community Member',
    email: user.email || '',
    role: 'public',
    isEmailVerified: user.emailVerified,
    createdAt,
  };
  return Object.fromEntries(Object.entries(defaults).filter(([key]) => existing[key] == null));
}
