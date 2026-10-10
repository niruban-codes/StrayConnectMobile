import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
// src/screens/SignupScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Animated, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ensureUserProfile } from '../services/userProfile';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '../../firebase';

const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Initialize Google Sign-In
    GoogleSignin.configure({
      webClientId: '447208299459-ec7nftghokahr5ngt3odcf0sav1fqqni.apps.googleusercontent.com',
      offlineAccess: true,
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const validatePassword = (pw) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(pw);
  };

  const handleSignup = async () => {
    setPasswordError('');
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Missing Info', 'Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return setPasswordError('Passwords do not match.');
    }
    if (!validatePassword(password)) {
      return setPasswordError('Password must be at least 8 characters, include an uppercase letter, a number, and a special character.');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: 'public',
        isEmailVerified: false,
        createdAt: new Date()
      });

      await sendEmailVerification(user);
      Alert.alert('Welcome! 🎉', 'Your account is ready. We have sent a verification link to your email.');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Email taken', 'An account already exists with this email.');
      } else {
        Alert.alert('Signup Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.idToken || response.data?.idToken;

      if (!idToken) throw new Error('No ID Token recovered from Google.');

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      await ensureUserProfile(user);
    } catch (err) {
      if (err.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Google Sign-In Failed', err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />



      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <TouchableOpacity
          style={[styles.backBtn, { top: Math.max(insets.top + 16, 16) }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 80,
              paddingBottom: Math.max(insets.bottom + 20, 40)
            }
          ]}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.headerBox}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Join the Network</Text>
                <View style={styles.iconBg}>
                  <MaterialCommunityIcons name="account-heart" size={28} color={COLORS.surface} />
                </View>
              </View>
              <Text style={styles.subtitle}>Create an account to start rescuing and tracking your local impact.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kasun Perera"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Type password again"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (loading || googleLoading) && styles.submitBtnDisabled]}
                onPress={handleSignup}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* 🚀 OR DIVIDER */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 🚀 GOOGLE BUTTON */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogleSignUp}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <View style={styles.googleBtnContent}>
                    <Image source={require('../../assets/images/google-g.png')} style={styles.googleIcon} resizeMode="contain" accessible={false} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { position: 'absolute', left: 24, padding: 10, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink, zIndex: 10 },
  headerBox: { marginBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { flex: 1, fontFamily: "Silkscreen_700Bold", fontSize: 29, color: COLORS.primary, letterSpacing: 0, lineHeight: 40 },
  iconBg: { width: 48, height: 48, borderRadius: 0, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }], borderWidth: 3, borderColor: palette.ink },
  subtitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.primary, opacity: 0.8, lineHeight: 22 },

  form: { gap: 16 },
  inputWrapper: { gap: 6 },
  label: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.primary, marginLeft: 4, letterSpacing: -0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 0, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  inputError: { borderColor: palette.ink, borderWidth: 3 },
  input: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8, fontFamily: "Poppins_400Regular", fontSize: 15, color: COLORS.textDark, minHeight: 36, paddingHorizontal: 0, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center' },
  errorText: { fontFamily: "Poppins_700Bold", color: COLORS.error, fontSize: 12, marginLeft: 4, marginTop: 2, lineHeight: 16 },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 0, paddingVertical: 18, alignItems: 'center', marginTop: 8, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontFamily: "Silkscreen_700Bold", color: COLORS.surface, fontSize: 14, letterSpacing: 0 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.primary, opacity: 0.15 },
  dividerText: { fontFamily: "Poppins_700Bold", color: COLORS.primary, opacity: 0.4, fontSize: 12, textAlign: 'center', width: 40 },

  googleBtn: { backgroundColor: COLORS.surface, borderRadius: 0, paddingVertical: 18, alignItems: 'center', borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  googleBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleBtnText: { fontFamily: "Poppins_700Bold", color: COLORS.primary, fontSize: 16, letterSpacing: -0.3 },
});
