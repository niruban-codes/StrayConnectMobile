import { reload, getIdToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { createVerificationRefresh } from '../utils/emailVerification';
export const refreshVerifiedUser = createVerificationRefresh({
  currentUser: () => auth.currentUser,
  reloadUser: reload,
  refreshToken: user => getIdToken(user, true),
});
