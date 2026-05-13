// src/screens/EventDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#154212', background: '#faf9f6', surface: '#ffffff',
  text: '#1a1c1a', textLight: '#42493e', outline: '#c2c9bb', blue: '#2563eb'
};

export default function EventDetailScreen({ route, navigation }) {
  // Grab the event data passed from the HomeScreen
  const { event } = route.params;

  // Format the date securely
  const eventDate = event.date?.toDate ? event.date.toDate() : (event.date ? new Date(event.date) : new Date());
  const dateString = eventDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // If we saved it as a string from the app, use that for time/date fallback
  const displayDate = event.dateString || dateString;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.placeholderBg]}>
              <MaterialCommunityIcons name="calendar-star" size={64} color="#fff" style={{ opacity: 0.5 }} />
            </View>
          )}
          
          {/* Back Button overlay */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1a1c1a" />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <View style={styles.content}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{event.type}</Text>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>{displayDate}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <MaterialCommunityIcons name="shield-check" size={18} color={COLORS.blue} />
              <Text style={styles.organizerName}>{event.organizer}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  heroContainer: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderBg: { backgroundColor: '#2d5a27', alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, marginTop: -30, backgroundColor: COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f0e4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  typeText: { color: COLORS.primary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 24, lineHeight: 32 },
  metaBox: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(194,201,187,0.4)', marginBottom: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f4f3f1', alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  metaValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: 'rgba(194,201,187,0.3)', marginVertical: 16, marginLeft: 60 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  description: { fontSize: 15, color: COLORS.textLight, lineHeight: 24, marginBottom: 32 },
  organizerBox: { backgroundColor: '#f4f3f1', padding: 16, borderRadius: 16 },
  organizerLabel: { fontSize: 12, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  organizerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});