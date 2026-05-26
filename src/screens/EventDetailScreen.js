// src/screens/EventDetailScreen.js
import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, StatusBar, Animated, Dimensions 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 IMPORT INSETS
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', // Subtle dark blue tint for borders
  textDark: '#00171F',      // Neutral 100
  textMuted: '#52616B',     // Darkened slightly for contrast
  
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

export default function EventDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS
  const { event } = route.params;

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Trigger smooth entrance animation
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

  // Format the date securely
  const eventDate = event.date?.toDate ? event.date.toDate() : (event.date ? new Date(event.date) : new Date());
  const dateString = eventDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // If we saved it as a string from the app, use that for time/date fallback
  const displayDate = event.dateString || dateString;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* 🌟 FULL-BLEED HERO IMAGE */}
      <View style={styles.heroContainer}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.placeholderBg]}>
            <MaterialCommunityIcons name="calendar-star" size={64} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.heroOverlay} />
        
        {/* 🚀 FIXED: Transparent Floating Header with Insets */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🌟 ANIMATED BOTTOM SHEET */}
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.sheetContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }} // 🚀 ADD BOTTOM INSET
      >
        <View style={styles.sheetHandle} />

        {/* Content Body */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{event.type}</Text>
        </View>
        
        <Text style={styles.title}>{event.title}</Text>
        
        {/* 🌟 PREMIUM INFO CARDS */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.orangeShine} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Date & Time</Text>
              <Text style={styles.metaValue}>{displayDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={[styles.iconBox, { backgroundColor: '#E1F5FE' }]}>
              <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.blueSea} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>About this Event</Text>
        <Text style={styles.description}>{event.description || "Join the community for this exciting event!"}</Text>

        <View style={styles.organizerBox}>
          <Text style={styles.organizerLabel}>Organized by</Text>
          <View style={styles.organizerRow}>
            <View style={styles.organizerIconBg}>
              <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.organizerName}>{event.organizer}</Text>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Hero Section
  heroContainer: { width: '100%', height: 350, position: 'absolute', top: 0, left: 0 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderBg: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.3)' },
  
  // Floating Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  
  // Animated Sheet
  sheetContainer: { flex: 1, marginTop: 280, backgroundColor: COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sheetHandle: { width: 40, height: 5, backgroundColor: COLORS.border, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  
  // Typography & Badges
  typeBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 16 },
  typeText: { color: COLORS.surface, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 32, lineHeight: 38, letterSpacing: -1 },
  
  // Info Cards
  metaBox: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, marginLeft: 68 },
  
  // Description
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 12, letterSpacing: -0.5 },
  description: { fontSize: 15, color: COLORS.textMuted, lineHeight: 24, marginBottom: 32, fontWeight: '500' },
  
  // Organizer Box
  organizerBox: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  organizerLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '800', marginBottom: 12 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  organizerName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
});