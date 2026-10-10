import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { pushSession } from '../services/pushSession';
import { palette, fonts } from '../design/theme';
import ArcadeButton from '../components/ArcadeButton';
import UserAvatar, { USER_AVATARS } from '../components/UserAvatar';
import { AVATAR_IDS, profileChanges, validatePasswordChange } from '../utils/accountSettings';

const errorMessage = error => ({
  'auth/invalid-credential': 'The current password is incorrect. Try again or use Forgot password.',
  'auth/wrong-password': 'The current password is incorrect. Try again or use Forgot password.',
  'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
  'auth/network-request-failed': 'Check your connection and try again.',
  'auth/requires-recent-login': 'Please sign out and sign in again before changing your password.',
  'auth/weak-password': 'Choose a stronger password that meets the requirements.',
}[error.code] || error.message || 'Please try again.');

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [avatarId, setAvatarId] = useState('initial');
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState('');
  const lock = useRef(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const hasPassword = user?.providerData.some(provider => provider.providerId === 'password');
  const dirty = saved && (name.trim() !== saved.name || avatarId !== saved.avatarId);

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(false);
    if (!user) { setLoading(false); setLoadError(true); return; }
    getDoc(doc(db, 'users', user.uid)).then(snapshot => {
      if (!active) return;
      const data = snapshot.data() || {};
      const initial = { name: data.name ?? user.displayName ?? '', avatarId: AVATAR_IDS.includes(data.avatarId) ? data.avatarId : 'initial' };
      setName(initial.name); setAvatarId(initial.avatarId); setSaved(initial);
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid, reload]);

  const run = async (kind, action) => {
    if (lock.current) return;
    lock.current = true; setBusy(kind);
    try {
      if (!user || auth.currentUser?.uid !== user.uid) throw new Error('Please sign in again.');
      await action();
    } catch (error) { Alert.alert('Unable to complete this change', errorMessage(error)); }
    finally { lock.current = false; setBusy(''); }
  };
  const save = () => run('profile', async () => {
    const fields = profileChanges(name, avatarId);
    // Keep Auth-based greetings and the live profile document aligned.
    await updateProfile(user, { displayName: fields.name });
    await setDoc(doc(db, 'users', user.uid), fields, { merge: true });
    setName(fields.name); setSaved(fields);
    Alert.alert('Profile saved', 'Your name and avatar are updated on your profile.');
  });
  const changePassword = () => run('password', async () => {
    validatePasswordChange(currentPassword, newPassword, confirmation);
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
    setCurrentPassword(''); setNewPassword(''); setConfirmation(''); setShowPasswords(false);
    Alert.alert('Password updated', 'Use your new password next time you sign in.');
  });
  const resetPassword = () => run('reset', async () => {
    await sendPasswordResetEmail(auth, user.email);
    Alert.alert('Reset email sent', `Check ${user.email} for a password reset link.`);
  });
  const signOut = () => run('logout', async () => { await pushSession.logout(user.uid); });
  const confirmSignOut = () => Alert.alert('Sign out?', dirty ? 'You have unsaved profile changes. Sign out and discard them?' : 'You can sign in again at any time.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut },
  ]);
  const back = () => {
    if (!dirty) { navigation.goBack(); return; }
    Alert.alert('Unsaved changes', 'Save your profile changes before leaving, or discard them.', [
      { text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar barStyle="dark-content" />
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity disabled={!!busy} onPress={back} accessibilityLabel="Back to profile" style={styles.back}><MaterialCommunityIcons name="arrow-left" size={24} color={palette.ink} /></TouchableOpacity>
      <Text style={styles.title}>SETTINGS</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 36 }}>
      <View style={styles.card}>
        <Text style={styles.heading}>YOUR PLAYER CARD</Text>
        {loading ? <ActivityIndicator color={palette.ink} /> : loadError ? <>
          <Text style={styles.help}>Could not load your profile. Check your connection and retry.</Text>
          <ArcadeButton onPress={() => setReload(value => value + 1)}>RETRY</ArcadeButton>
        </> : <>
          <View style={styles.preview}><UserAvatar avatarId={avatarId} name={name} size={84} /><View style={{ flex: 1 }}><Text style={styles.label}>{name.trim() || 'Your name'}</Text><Text style={styles.help}>Preview your profile</Text></View></View>
          <Text style={styles.label}>Username / display name</Text>
          <TextInput value={name} onChangeText={setName} editable={!busy} maxLength={40} style={styles.input} placeholder="Your name" placeholderTextColor="#555" accessibilityLabel="Username or display name" autoCapitalize="words" />
          <Text style={styles.help}>This is the name shown on your profile.</Text>
          <Text style={styles.label}>Choose your pixel avatar</Text>
          <View style={styles.avatarGrid}>{USER_AVATARS.map(avatar => <TouchableOpacity key={avatar.id} disabled={!!busy} onPress={() => setAvatarId(avatar.id)}
            accessibilityRole="radio" accessibilityState={{ checked: avatarId === avatar.id }} accessibilityLabel={`${avatar.label} avatar`}
            style={[styles.avatarOption, avatarId === avatar.id && { backgroundColor: palette.yellow }]}>
            <UserAvatar avatarId={avatar.id} name={name} size={60} /><Text style={styles.avatarLabel}>{avatarId === avatar.id ? '✓ ' : ''}{avatar.label}</Text>
          </TouchableOpacity>)}</View>
          <ArcadeButton disabled={!!busy || !dirty} onPress={save} color={palette.mint}>{busy === 'profile' ? 'SAVING…' : 'SAVE CHANGES'}</ArcadeButton>
        </>}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>ACCOUNT SECURITY</Text>
        <Text style={styles.help}>{user?.email}</Text>
        {hasPassword ? <>
          <Text style={styles.help}>Use at least 8 characters, uppercase, lowercase, a number and a special character (@$!%*?&).</Text>
          {[
            ['Current password', currentPassword, setCurrentPassword, 'current-password'],
            ['New password', newPassword, setNewPassword, 'new-password'],
            ['Confirm new password', confirmation, setConfirmation, 'new-password'],
          ].map(([label, value, setter, autoComplete]) => <View key={label}>
            <Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={setter} placeholder={label} placeholderTextColor="#555"
              accessibilityLabel={label} secureTextEntry={!showPasswords} autoCapitalize="none" autoCorrect={false} autoComplete={autoComplete} editable={!busy} />
          </View>)}
          <TouchableOpacity disabled={!!busy} onPress={() => setShowPasswords(value => !value)} style={styles.link}><Text style={styles.label}>{showPasswords ? 'Hide passwords' : 'Show passwords'}</Text></TouchableOpacity>
          <ArcadeButton disabled={!!busy || !currentPassword || !newPassword || !confirmation} onPress={changePassword}>{busy === 'password' ? 'UPDATING…' : 'CHANGE PASSWORD'}</ArcadeButton>
          <TouchableOpacity disabled={!!busy} onPress={resetPassword} style={styles.link}><Text style={styles.label}>{busy === 'reset' ? 'Sending reset email…' : 'Forgot password? Send reset email'}</Text></TouchableOpacity>
        </> : <Text style={styles.help}>You sign in with Google. Change or reset your Google password in your Google Account settings.</Text>}
      </View>
      <ArcadeButton disabled={!!busy} onPress={confirmSignOut} color={palette.paper}>{busy === 'logout' ? 'SIGNING OUT…' : 'SIGN OUT'}</ArcadeButton>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.purple },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingBottom: 12 },
  back: { borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.paper, padding: 8 },
  title: { fontFamily: fonts.title, fontSize: 20, color: palette.ink },
  card: { padding: 16, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.paper, boxShadow: '4px 4px 0px 0px #111111', marginBottom: 24, gap: 12 },
  heading: { fontFamily: fonts.title, fontSize: 16, color: palette.ink },
  label: { fontFamily: fonts.bold, fontSize: 14, color: palette.ink },
  help: { fontFamily: fonts.body, fontSize: 12, color: '#454545', lineHeight: 19 },
  input: { borderWidth: 3, borderColor: palette.ink, minHeight: 52, paddingHorizontal: 12, paddingVertical: 10, includeFontPadding: false, textAlignVertical: 'center', fontFamily: fonts.body, fontSize: 15, color: palette.ink, marginTop: 6 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 6 },
  avatarOption: { padding: 6, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', gap: 4 },
  avatarLabel: { fontFamily: fonts.bold, fontSize: 11, color: palette.ink },
  link: { paddingVertical: 12, minHeight: 44 },
});
