export async function changePetStatus(tx, ref, uid, expectedStatus, patch) {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists()) throw new Error('This passport no longer exists.');
  const animal = snapshot.data();
  if (animal.status === 'archived') throw new Error('This passport has been archived.');
  if (!uid || animal.ownerId !== uid) throw new Error('You no longer own this animal.');
  if (animal.status !== expectedStatus) throw new Error('This animal changed. Reopen its passport before continuing.');
  tx.update(ref, patch);
}
