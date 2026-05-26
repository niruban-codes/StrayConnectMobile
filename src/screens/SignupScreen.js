// src/screens/SignupScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Animated, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 IMPORT INSETS
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  error: '#FF564F',         // Pink Red for errors
};

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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

  // Password Validation Rule
  const validatePassword = (pw) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(pw);
  };

  const handleSignup = async () => {
    setPasswordError('');

    // 1. Check for empty fields
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Missing Info', 'Please fill in all fields.');
    }

    // 2. Check if passwords match
    if (password !== confirmPassword) {
      return setPasswordError('Passwords do not match.');
    }

    // 3. Check password strength
    if (!validatePassword(password)) {
      return setPasswordError('Password must be at least 8 characters, include an uppercase letter, a number, and a special character.');
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Auth Profile name
      await updateProfile(user, { displayName: name });
      
      // Save full profile to Firestore Database
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: 'public',
        isEmailVerified: false, // Flag for future use
        createdAt: new Date()
      });

      // Send Verification Email in the background
      await sendEmailVerification(user);
      
      Alert.alert(
        'Welcome to StrayConnect! 🎉', 
        'Your account is ready. We have sent a verification link to your email.'
      );

      // App.js will automatically detect the user and switch to the Main Tabs!

    } catch (err) {
      // Handle Firebase specific errors gracefully
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Email taken', 'An account already exists with this email.');
      } else if (err.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Signup Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚀 USE STANDARD VIEW FOR FULL COLOR COVERAGE Behind Status Bar
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        
        {/* 🚀 APPLY TOP INSET MANUALLY */}
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
              paddingBottom: Math.max(insets.bottom + 20, 40) // 🚀 ADD BOTTOM INSET FOR ACCESSIBLE SCROLLING
            }
          ]}
        >
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            <View style={styles.headerBox}>
              <View style={styles.iconBg}>
                <MaterialCommunityIcons name="account-heart" size={32} color={COLORS.surface} />
              </View>
              <Text style={styles.title}>Join the Network</Text>
              <Text style={styles.subtitle}>Create an account to start rescuing and tracking your local impact.</Text>
            </View>

            <View style={styles.form}>
              {/* Name Input */}
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

              {/* Email Input */}
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

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Create a strong password" 
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry 
                    value={password} 
                    onChangeText={setPassword} 
                  />
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.textMuted} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Type password again" 
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                onPress={handleSignup} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
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
  
  // Back Button (Floating above scroll)
  backBtn: { position: 'absolute', left: 24, padding: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, zIndex: 10 },
  
  // Header section
  headerBox: { marginBottom: 32 },
  iconBg: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: [{ rotate: '-10deg' }] },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.primary, marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: COLORS.primary, fontWeight: '600', opacity: 0.8, lineHeight: 22 },
  
  // Form
  form: { gap: 20 },
  inputWrapper: { gap: 8 },
  label: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginLeft: 4, letterSpacing: -0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  inputError: { borderColor: COLORS.error, borderWidth: 1.5 },
  input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  errorText: { color: COLORS.error, fontSize: 12, marginLeft: 4, marginTop: 2, lineHeight: 16, fontWeight: '600' },
  
  // Submit Button
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
});