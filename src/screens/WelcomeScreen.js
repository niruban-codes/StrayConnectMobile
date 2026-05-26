// src/screens/WelcomeScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 CHANGED IMPORT
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 🎨 "MONITO" COLOR PALETTE
const COLORS = {
  primary: '#003459',       // Dark Blue
  secondary: '#F7DBA7',     // Mon Yellow
  background: '#FDFDFD',    // Neutral 00
  surface: '#FFFFFF',       // Pure White
  pinkRed: '#FF564F',
};

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Trigger smooth fade and slide up on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Cinematic Background Image */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
      />

      {/* The Magic Gradient: 
        Transparent at the top so the photo is clear.
        Fades to our deep Monito Primary Blue at the bottom for perfect text readability.
      */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 52, 89, 0.6)', '#003459']}
        locations={[0, 0.4, 1]}
        style={styles.gradientOverlay}
      />

      {/* 🚀 FIXED CONTAINER WITH MANUAL INSETS */}
      <View style={[
        styles.safe, 
        { 
          paddingTop: Math.max(insets.top, 16), 
          paddingBottom: Math.max(insets.bottom, 24) 
        }
      ]}>
        {/* Animated Wrapper for all content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Top Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.iconGlow}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.brandText}>StrayConnect</Text>
          </View>

          {/* Bottom Content Area */}
          <View style={styles.actionSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Sri Lanka's Rescue Network</Text>
            </View>
            
            <Text style={styles.title}>Every stray deserves a story.</Text>
            <Text style={styles.subtitle}>
              Join the community. Report animals in need, find your new best friend, and track your local impact.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Signup')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  backgroundImage: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    opacity: 0.85 
  },
  gradientOverlay: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
  },
  safe: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
  },
  
  // Branding
  brandContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 20 
  },
  iconGlow: {
    padding: 10,
    backgroundColor: 'rgba(247, 219, 167, 0.15)', // Faint yellow glow
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(247, 219, 167, 0.3)',
  },
  brandText: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: -0.5 
  },
  
  // Action Section
  actionSection: { 
    gap: 16 
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: { 
    fontSize: 48, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: -1.5, 
    lineHeight: 52, 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.8)', 
    lineHeight: 24, 
    marginBottom: 32,
    fontWeight: '500',
    paddingRight: 20, 
  },
  
  // Buttons
  buttonContainer: { 
    gap: 14 
  },
  primaryBtn: { 
    backgroundColor: COLORS.secondary, 
    borderRadius: 16, 
    paddingVertical: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: { 
    color: COLORS.primary, 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: -0.3
  },
  secondaryBtn: { 
    backgroundColor: 'transparent', 
    borderRadius: 16, 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  secondaryBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800' 
  },
});