export function createVerificationRefresh({ currentUser, reloadUser, refreshToken }) {
  let pending;
  return async function refresh() {
    const user = currentUser();
    if (!user) return null;
    if (pending?.uid === user.uid) return pending.promise;
    const uid = user.uid;
    const promise = (async () => {
      const wasVerified = user.emailVerified;
      await reloadUser(user);
      if (currentUser()?.uid !== uid) throw new Error('Your account changed. Please try again.');
      if (!wasVerified && user.emailVerified) await refreshToken(user);
      return user;
    })();
    pending = { uid, promise };
    try { return await promise; }
    finally { if (pending?.promise === promise) pending = null; }
  };
}
