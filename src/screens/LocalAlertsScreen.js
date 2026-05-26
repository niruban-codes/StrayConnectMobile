// src/screens/LocalAlertsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, Image, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  pinkRed: '#FF564F',       // SOS / Alert Color
  blueSea: '#00A7E7',
  orangeShine: '#FF912C',
};

const HEADER_HEIGHT = 60; 

export default function LocalAlertsScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🚀 SCROLLING HEADER ANIMATION VALUES
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const clampedScrollY = Animated.diffClamp(
    scrollY.interpolate({
      inputRange: [0, 10000],
      outputRange: [0, 10000],
      extrapolateLeft: 'clamp',
    }),
    0,
    HEADER_HEIGHT
  );

  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT], // Slides up completely
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    // SOS Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedAlerts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setAlerts(fetchedAlerts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 LAYER 1: SOLID BACKGROUND FOR STATUS BAR */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: insets.top,
        backgroundColor: COLORS.background,
        zIndex: 101 // HIGHEST Z-INDEX
      }} />

      {/* 🚀 LAYER 2: ANIMATED HEADER (Slides behind Layer 1) */}
      <Animated.View style={[
        styles.header, 
        { 
          top: insets.top, // Starts exactly below Layer 1
          height: HEADER_HEIGHT, 
          transform: [{ translateY: headerTranslateY }] 
        }
      ]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="radar" size={24} color={COLORS.pinkRed} />
          <Text style={styles.headerTitle}>SOS Alerts</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 20 } // Start feed below header
        ]} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* 🚀 ANIMATED CONTENT */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* 🌟 RADAR STATUS CARD */}
          <View style={styles.radarBanner}>
            <Animated.View style={[styles.radarPulse, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.radarIconBg}>
                <MaterialCommunityIcons name="broadcast" size={28} color={COLORS.surface} />
              </View>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radarTitle}>Active SOS Radar</Text>
              <Text style={styles.radarSub}>Real-time reports needing immediate community help. <Text style={{color: COLORS.pinkRed}}>✦</Text></Text>
            </View>
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="shield-check" size={60} color={COLORS.primary} style={{ opacity: 0.2 }} />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySub}>There are no pending SOS alerts in your area right now.</Text>
            </View>
          ) : (
            alerts.map(alert => (
              <TouchableOpacity 
                key={alert.id} 
                style={styles.alertCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AlertDetail', { alertItem: alert })}
              >
                <View style={styles.imageContainer}>
                  {alert.imageUrl ? (
                    <Image source={{ uri: alert.imageUrl }} style={styles.alertImage} />
                  ) : (
                    <View style={[styles.alertImage, styles.placeholderBg]}>
                      <MaterialCommunityIcons name="camera-off" size={40} color={COLORS.border} />
                    </View>
                  )}
                  
                  <View style={styles.typeBadge}>
                    <MaterialCommunityIcons name="alert-octagon" size={12} color="#fff" />
                    <Text style={styles.typeBadgeText}>{alert.incidentType}</Text>
                  </View>

                  {alert.photoUrls && alert.photoUrls.length > 1 && (
                    <View style={styles.multiPhotoBadge}>
                      <MaterialCommunityIcons name="layers-outline" size={12} color="#fff" />
                      <Text style={styles.multiPhotoText}>{alert.photoUrls.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.alertContent}>
                  <View style={styles.topRow}>
                    <Text style={styles.animalType}>{alert.animalType} Alert</Text>
                    <Text style={styles.timeText}>
                      {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </Text>
                  </View>

                  <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="map-marker-radius" size={16} color={COLORS.primary} />
                    <Text style={styles.locationText} numberOfLines={1}>{alert.location}</Text>
                  </View>
                  
                  <Text style={styles.descText} numberOfLines={2}>"{alert.description}"</Text>

                  <View style={styles.footer}>
                    <Text style={styles.respondText}>Respond to SOS</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // 🌟 Header Styles Adjusted for 2-Layer System
  header: { 
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.background, 
    zIndex: 100 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  headerBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Radar Status Card
  radarBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, marginBottom: 28, gap: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  radarPulse: { position: 'relative' },
  radarIconBg: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.pinkRed, alignItems: 'center', justifyContent: 'center' },
  radarTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 4 },
  radarSub: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, fontWeight: '600' },
  
  // Monito Style Alert Cards
  alertCard: { backgroundColor: COLORS.surface, borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  imageContainer: { width: '100%', height: 180, padding: 8 },
  alertImage: { width: '100%', height: '100%', borderRadius: 18, resizeMode: 'cover' },
  placeholderBg: { backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  
  typeBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: COLORS.pinkRed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  multiPhotoBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  multiPhotoText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  
  // Card Text
  alertContent: { padding: 16, paddingTop: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  animalType: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  timeText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  locationText: { fontSize: 14, fontWeight: '800', color: COLORS.primary, flex: 1 },
  
  descText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 20, marginBottom: 16, fontWeight: '500' },
  
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  respondText: { fontSize: 12, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40, fontWeight: '600', lineHeight: 20 },
});