export async function setPetMissing(tx, ref, uid, missing, timestamp) {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists()) throw new Error('This passport no longer exists.');
  const pet = snapshot.data();
  if (!uid || pet.ownerId !== uid) throw new Error('Only the current owner can update this pet.');
  if (pet.status === 'archived') throw new Error('Archived passports cannot be changed.');
  if (missing) {
    if (pet.status === 'lost') return;
    if (!['owned', 'adopted', 'sheltered'].includes(pet.status)) throw new Error('This pet cannot be marked missing.');
    tx.update(ref, { status: 'lost', statusBeforeLost: pet.status, reportedLostAt: timestamp });
  } else {
    if (pet.status !== 'lost') throw new Error('This pet is no longer marked missing.');
    const previous = ['owned', 'adopted', 'sheltered'].includes(pet.statusBeforeLost)
      ? pet.statusBeforeLost : pet.adoptedBy === uid ? 'adopted' : 'owned';
    tx.update(ref, { status: previous, statusBeforeLost: null, reportedLostAt: null, foundAt: timestamp });
  }
}
