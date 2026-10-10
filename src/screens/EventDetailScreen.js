import PhotoPreview from '../components/PhotoPreview';
import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
import { eventDateLabel } from '../utils/eventDate';
// src/screens/EventDetailScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Animated, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

export default function EventDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { event } = route.params;

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const displayDate = eventDateLabel(event);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* 🌟 FULL-BLEED HERO IMAGE */}
      <View style={styles.heroContainer}>
        {event.imageUrl ? (
          <PhotoPreview uri={event.imageUrl} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.placeholderBg]}>
            <MaterialCommunityIcons name="calendar-star" size={64} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View pointerEvents="none" style={styles.heroOverlay} />

        {/* Transparent Floating Header */}
        <View pointerEvents="box-none" style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🌟 ANIMATED BOTTOM SHEET */}
      <Animated.View style={[styles.sheetShadowContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetInner}>



          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 + insets.bottom, paddingHorizontal: 24, paddingTop: 16 }}
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

          </ScrollView>
        </View>
      </Animated.View>
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
  backBtn: { padding: 10, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },

  // 🚀 Animated Sheet with Background
  sheetShadowContainer: { flex: 1, marginTop: 280, boxShadow: "4px 4px 0px 0px #111111" },
  sheetInner: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden', borderWidth: 3, borderColor: palette.ink },
  sheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(0, 52, 89, 0.2)', borderRadius: 0, alignSelf: 'center', marginBottom: 24 },

  // 🚀 Typography Updates
  typeBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 0, marginBottom: 16, borderWidth: 3, borderColor: palette.ink },
  typeText: { fontFamily: "Poppins_700Bold", color: COLORS.surface, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: "Silkscreen_700Bold", fontSize: 26, color: COLORS.primary, marginBottom: 32, lineHeight: 38, letterSpacing: 0 },

  // Info Cards
  metaBox: { backgroundColor: COLORS.surface, borderRadius: 0, padding: 20, borderWidth: 3, borderColor: palette.ink, marginBottom: 32, boxShadow: "4px 4px 0px 0px #111111" },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, marginLeft: 68 },

  // Description
  sectionTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, marginBottom: 12, letterSpacing: 0 },
  description: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.textMuted, lineHeight: 24, marginBottom: 32 },

  // Organizer Box
  organizerBox: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  organizerLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  organizerIconBg: { width: 36, height: 36, borderRadius: 0, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.ink },
  organizerName: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.textDark },
});
