// src/screens/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated, StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 IMPORT INSETS
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  error: '#FF564F',
};

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled automatically by App.js listener
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚀 USE STANDARD VIEW FOR EDGE-TO-EDGE BACKGROUND
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* 🚀 MANUALLY INJECT TOP INSET TO BACK BUTTON */}
        <TouchableOpacity 
          style={[styles.backBtn, { top: Math.max(insets.top + 16, 16) }]} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <View style={styles.headerBox}>
            <View style={styles.iconBg}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.surface} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
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
                secureTextEntry
                value={password} 
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.submitText}>Log In</Text>
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
  
  // Back Button
  backBtn: { position: 'absolute', left: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, zIndex: 10 },
  
  // Header section
  headerBox: { marginBottom: 32 },
  iconBg: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: [{ rotate: '-10deg' }] },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.primary, marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: COLORS.primary, fontWeight: '600', opacity: 0.8 },
  
  // Form
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  input: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  
  // Submit Button
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
});