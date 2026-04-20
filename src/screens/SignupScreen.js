// src/screens/SignupScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  outlineVariant: '#c2c9bb',
  error: '#ba1a1a',
  surface: '#ffffff',
};

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
        'Welcome to StrayConnect!', 
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join the Network</Text>
            <Text style={styles.subtitle}>Create an account to start rescuing and tracking your local impact.</Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.outlineVariant} />
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Kasun Perera" 
                  value={name} 
                  onChangeText={setName} 
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.outlineVariant} />
                <TextInput 
                  style={styles.input} 
                  placeholder="name@example.com" 
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
                <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.outlineVariant} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Create a strong password" 
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
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.outlineVariant} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Type password again" 
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Create Account</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24, 
    paddingTop: 10,
    paddingBottom: 40 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    backgroundColor: COLORS.surface, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24
  },
  header: {
    marginBottom: 32,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: COLORS.primary, 
    marginBottom: 8,
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: 15, 
    color: '#42493e', 
    lineHeight: 22 
  },
  form: { 
    gap: 20 
  },
  inputWrapper: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(194,201,187,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  input: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 15, 
    color: '#1a1c1a' 
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
    lineHeight: 16,
  },
  submitBtn: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 999, 
    padding: 18, 
    alignItems: 'center', 
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800' 
  },
});