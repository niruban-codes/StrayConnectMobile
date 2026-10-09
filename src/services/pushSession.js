import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteField, doc, runTransaction } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { createPushSession } from '../utils/pushSession';
const key = uid => `strayconnect.pushTokens.${uid}`;
export const pushSession = createPushSession({
  async attach(uid, token) {
    // Persist before writing, so logout can clean up even after an uncertain write response.
    const previous = JSON.parse(await AsyncStorage.getItem(key(uid)) || '[]');
    const knownTokens = [...new Set([...previous, token])];
    await AsyncStorage.setItem(key(uid), JSON.stringify(knownTokens));
    await runTransaction(db, async tx => {
      const ref = doc(db, 'users', uid);
      const snapshot = await tx.get(ref);
      const tokens = (snapshot.data()?.expoPushTokens || []).filter(item => !knownTokens.includes(item));
      tx.set(ref, { expoPushTokens: [...tokens, token], expoPushToken: deleteField() }, { merge: true });
    });
  },
  async detach(uid) {
    const tokens = JSON.parse(await AsyncStorage.getItem(key(uid)) || '[]');
    await runTransaction(db, async tx => {
      const ref = doc(db, 'users', uid);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) return;
      tx.update(ref, { expoPushToken: deleteField(),
        expoPushTokens: (snapshot.data().expoPushTokens || []).filter(item => !tokens.includes(item)),
      });
    });
    await AsyncStorage.removeItem(key(uid));
  },
  signOut: () => signOut(auth),
});
