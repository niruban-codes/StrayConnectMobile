import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
// src/screens/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../../firebase';
import { ensureUserProfile } from '../services/userProfile';

const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🚀 ANIMATION VALUES
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

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // Handle variations in Google SDK response structures safely
      const idToken = response.idToken || response.data?.idToken;

      if (!idToken) throw new Error('No ID Token recovered from Google.');

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      await ensureUserProfile(result.user);
    } catch (err) {
      // Avoid alerting if the user manually cancels the popup box
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

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={styles.headerBox}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Welcome Back</Text>
              <View style={styles.iconBg}>
                <Image
                  source={require('../../assets/images/sc-logo.png')}
                  style={styles.logoImage}
                />
              </View>
            </View>
            <Text style={styles.subtitle}>Log in to continue your impact.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Password"
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

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading || googleLoading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.submitText}>Log In</Text>
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
              onPress={handleGoogleSignIn}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24 },


  backBtn: { position: 'absolute', left: 24, padding: 10, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink, zIndex: 10 },
  headerBox: { marginBottom: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { flex: 1, fontFamily: "Silkscreen_700Bold", fontSize: 29, color: COLORS.primary, letterSpacing: 0, lineHeight: 40 },
  iconBg: { width: 48, height: 48, borderRadius: 0, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }], borderWidth: 3, borderColor: palette.ink },
  logoImage: { width: 28, height: 28, resizeMode: 'contain', borderRadius: 0 },
  subtitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.primary, opacity: 0.8, lineHeight: 22 },

  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 0, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  input: { flex: 1, marginLeft: 12, marginRight: 8, fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.textDark, paddingVertical: 0 },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 0, paddingVertical: 18, alignItems: 'center', marginTop: 8, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  submitText: { fontFamily: "Silkscreen_700Bold", color: COLORS.surface, fontSize: 14, letterSpacing: 0 },

  // Divider Design
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.primary, opacity: 0.15 },
  dividerText: { fontFamily: "Poppins_700Bold", color: COLORS.primary, opacity: 0.4, horizontalPadding: 16, fontSize: 12, mx: 12, textAlign: 'center', width: 40 },

  // Google Button Design
  googleBtn: { backgroundColor: COLORS.surface, borderRadius: 0, paddingVertical: 18, alignItems: 'center', borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  googleBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleBtnText: { fontFamily: "Poppins_700Bold", color: COLORS.primary, fontSize: 16, letterSpacing: -0.3 },
});
