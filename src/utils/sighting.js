export const DEFAULT_SIGHTING_REGION = {
  latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.08, longitudeDelta: 0.08,
};
export function validCoordinate(value) {
  return Boolean(value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180);
}
export function placeCoordinate(details) {
  const point = { latitude: details?.geometry?.location?.lat, longitude: details?.geometry?.location?.lng };
  return validCoordinate(point) ? point : null;
}
export async function saveSighting(tx, animalRef, sightingRef, notificationRef, payload, user, timestamp) {
  if (!user?.uid) throw new Error('Please sign in again to report a sighting.');
  if (!validCoordinate(payload)) throw new Error('Select a valid spot on the map.');
  const animalSnapshot = await tx.get(animalRef);
  const sightingSnapshot = await tx.get(sightingRef);
  // A retry of a committed report must not create another notification.
  if (sightingSnapshot.exists()) return Boolean(sightingSnapshot.data().ownerNotified);
  if (!animalSnapshot.exists()) throw new Error('This pet passport is no longer available.');
  const animal = animalSnapshot.data();
  if (animal.status !== 'lost') throw new Error('This pet is no longer listed as missing. Reopen its passport to see the latest status.');
  // Owners also receive a confirmation when recording their own sighting.
  const ownerNotified = Boolean(animal.ownerId);
  tx.set(sightingRef, { latitude: payload.latitude, longitude: payload.longitude,
    locationLabel: (payload.locationLabel || '').slice(0, 200), notes: (payload.notes || '').trim().slice(0, 280),
    reportedBy: user.uid, timestamp, ownerNotified });
  if (ownerNotified) {
    tx.set(notificationRef, { userId: animal.ownerId, type: 'sighting',
      title: `New Sighting: ${animal.name || 'Your pet'}`,
      message: `Someone marked where they saw ${animal.name || 'your pet'}.` + (payload.notes?.trim() ? ` ${payload.notes.trim().slice(0, 280)}` : ''),
      animalId: animalRef.id, sightingId: sightingRef.id,
      latitude: payload.latitude, longitude: payload.longitude, isRead: false, createdAt: timestamp });
  }
  return ownerNotified;
}
