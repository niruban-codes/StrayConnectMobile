export function applicationId(animalId, userId) { return encodeURIComponent(JSON.stringify([animalId, userId])); }
export async function submitAdoption(tx, animalRef, requestRef, user, fields, timestamp, legacyRefs = []) {
  if (!user?.uid || !user.emailVerified) throw new Error('Verify your email before applying.');
  const animalSnapshot = await tx.get(animalRef);
  const existing = await tx.get(requestRef);
  const legacy = await Promise.all(legacyRefs.map(ref => tx.get(ref)));
  if (existing.exists() || legacy.some(snapshot => snapshot.exists())) throw new Error('You have already applied for this pet. Check My adoption applications in Profile.');
  if (!animalSnapshot.exists()) throw new Error('This animal no longer exists.');
  const animal = animalSnapshot.data();
  if (!['stray', 'sheltered'].includes(animal.status)) throw new Error('This animal is no longer available for adoption.');
  if (!animal.isVerified) throw new Error('This pet needs vet verification before adoption applications can be accepted.');
  if (animal.ownerId === user.uid) throw new Error('You already own this pet.');
  const pending = animal.pendingAdoptionRequestIds || [];
  if (pending.length >= 100) throw new Error('This pet has reached its application limit. Please contact the shelter.');
  tx.set(requestRef, { ...fields, animalId: animalRef.id, animalName: animal.name || 'Unnamed pet',
    animalSCID: animal.animalId || '', userId: user.uid, userName: user.displayName || 'Community Member',
    userEmail: user.email || '', status: 'pending', createdAt: timestamp });
  // Registry lets approval close every competing application, including concurrent submissions.
  tx.update(animalRef, { pendingAdoptionRequestIds: [...pending, requestRef.id] });
}
