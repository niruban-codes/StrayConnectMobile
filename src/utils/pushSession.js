// Serialize registration and logout so a late registration cannot reattach a logged-out user.
export function createPushSession({ attach, detach, signOut }) {
  let activeUid = null;
  let queue = Promise.resolve();
  const enqueue = action => {
    const next = queue.then(action);
    queue = next.catch(() => {});
    return next;
  };
  return {
    activate(uid) { activeUid = uid; },
    register(uid, token) {
      return enqueue(async () => { if (activeUid === uid) await attach(uid, token); });
    },
    logout(uid) {
      activeUid = null;
      return enqueue(async () => {
        try { await detach(uid); await signOut(); }
        catch (error) { activeUid = uid; throw error; }
      });
    },
  };
}
