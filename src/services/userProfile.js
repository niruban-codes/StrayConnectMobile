import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { missingProfileFields } from '../utils/userProfile';

export async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const fields = missingProfileFields(user, snapshot.data() || {}, serverTimestamp());
    if (Object.keys(fields).length) transaction.set(ref, fields, { merge: true });
  });
}
