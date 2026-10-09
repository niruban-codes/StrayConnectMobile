import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../firebase';
import { refreshVerifiedUser } from '../services/emailVerification';
export function useVerifiedEmail() {
  const [verified, setVerified] = useState(Boolean(auth.currentUser?.emailVerified));
  const refresh = useCallback(async () => {
    const user = await refreshVerifiedUser();
    setVerified(Boolean(user?.emailVerified));
    return Boolean(user?.emailVerified);
  }, []);
  useFocusEffect(useCallback(() => { refresh().catch(() => {}); }, [refresh]));
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh().catch(() => {});
    });
    return () => listener.remove();
  }, [refresh]);
  return [verified, refresh];
}
