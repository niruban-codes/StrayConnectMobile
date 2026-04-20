// src/screens/WelcomeScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#154212',
  primaryFixed: '#bcf0ae',
  background: '#faf9f6',
};

export default function WelcomeScreen({ navigation }) {
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
        Transparent at the top so the dog's face is clear.
        Fades to a dark, rich green at the bottom for perfect text readability.
      */}
      <LinearGradient
        colors={['transparent', 'rgba(10, 33, 9, 0.4)', '#081a07']}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
      />

      <SafeAreaView style={styles.safe}>
        {/* Animated Wrapper for all content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Top Branding (Pushed down slightly for balance) */}
          <View style={styles.brandContainer}>
            <View style={styles.iconGlow}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.primaryFixed} />
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
                <MaterialCommunityIcons name="arrow-right" size={20} color="#002201" />
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
      </SafeAreaView>
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
    opacity: 0.9 
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
    padding: 24, 
    paddingBottom: 32 
  },
  brandContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 20 
  },
  iconGlow: {
    padding: 10,
    backgroundColor: 'rgba(188, 240, 174, 0.15)', // Faint glow behind the paw
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(188, 240, 174, 0.3)',
  },
  brandText: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#fff', 
    letterSpacing: -0.5 
  },
  actionSection: { 
    gap: 16 
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: { 
    fontSize: 46, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: -1.5, 
    lineHeight: 50, 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.7)', 
    lineHeight: 24, 
    marginBottom: 28,
    paddingRight: 20, // Keeps text from hitting the very edge
  },
  buttonContainer: { 
    gap: 14 
  },
  primaryBtn: { 
    backgroundColor: COLORS.primaryFixed, 
    borderRadius: 999, 
    paddingVertical: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    shadowColor: COLORS.primaryFixed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: { 
    color: '#002201', 
    fontSize: 17, 
    fontWeight: '800' 
  },
  secondaryBtn: { 
    backgroundColor: 'transparent', 
    borderRadius: 999, 
    paddingVertical: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  secondaryBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});