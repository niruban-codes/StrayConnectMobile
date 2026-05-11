// src/screens/LocalAlertsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  amber: '#d97706',
  error: '#ba1a1a',
};

export default function LocalAlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      fetchedAlerts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <MaterialCommunityIcons name="radar" size={24} color={COLORS.error} />
        <Text style={styles.headerTitle}>Local SOS Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.radarBanner}>
          <View style={styles.radarPulse}>
            <MaterialCommunityIcons name="broadcast" size={28} color={COLORS.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.radarTitle}>Active Rescues Near You</Text>
            <Text style={styles.radarSub}>These animals have been reported by the community and need immediate assistance.</Text>
          </View>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-check" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>There are no pending SOS alerts in your area right now.</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <TouchableOpacity 
              key={alert.id} 
              style={styles.alertCard}
              activeOpacity={0.9}
              // 🚀 NEW: Navigate to the detailed post view
              onPress={() => navigation.navigate('AlertDetail', { alertItem: alert })}
            >
              <View style={styles.imageContainer}>
                {alert.imageUrl ? (
                  <Image source={{ uri: alert.imageUrl }} style={styles.alertImage} />
                ) : (
                  <View style={[styles.alertImage, { backgroundColor: '#e9e8e5', alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialCommunityIcons name="camera-off" size={32} color={COLORS.outlineVariant} />
                  </View>
                )}
                
                {/* 🚀 NEW: Multiple photos indicator */}
                {alert.photoUrls && alert.photoUrls.length > 1 && (
                  <View style={styles.multiPhotoBadge}>
                    <MaterialCommunityIcons name="layers" size={14} color="#fff" />
                    <Text style={styles.multiPhotoText}>1/{alert.photoUrls.length}</Text>
                  </View>
                )}
              </View>

              <View style={styles.alertContent}>
                <View style={styles.typeRow}>
                  <View style={styles.typeBadge}>
                    <MaterialCommunityIcons name="alert-octagon" size={14} color="#fff" />
                    <Text style={styles.typeBadgeText}>{alert.incidentType}</Text>
                  </View>
                  <Text style={styles.timeText}>
                    {alert.createdAt?.toDate ? alert.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </Text>
                </View>

                <Text style={styles.animalType}>{alert.animalType} in Danger</Text>
                <Text style={styles.locationText}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.primary} /> {alert.location}
                </Text>
                <Text style={styles.descText} numberOfLines={2}>"{alert.description}"</Text>

                <View style={styles.viewMoreRow}>
                  <Text style={styles.viewMoreText}>Tap to view details & respond</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.outlineVariant} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(250,249,246,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(194,201,187,0.3)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.error },
  scrollContent: { padding: 20, paddingBottom: 40 },
  radarBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20, gap: 16, borderWidth: 1, borderColor: '#ffdad6', shadowColor: '#ba1a1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  radarPulse: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffdad6', alignItems: 'center', justifyContent: 'center' },
  radarTitle: { fontSize: 16, fontWeight: '800', color: '#1a1c1a', marginBottom: 4 },
  radarSub: { fontSize: 12, color: '#42493e', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1c1a', marginTop: 8 },
  emptySub: { fontSize: 14, color: '#72796e', textAlign: 'center', paddingHorizontal: 20 },
  alertCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#e9e8e5', shadowColor: '#1a1c1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  imageContainer: { position: 'relative' },
  alertImage: { width: '100%', height: 180, resizeMode: 'cover' },
  multiPhotoBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  multiPhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  alertContent: { padding: 16 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { fontSize: 12, fontWeight: '600', color: COLORS.outlineVariant },
  animalType: { fontSize: 20, fontWeight: '800', color: '#1a1c1a', marginBottom: 6 },
  locationText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 12 },
  descText: { fontSize: 13, color: '#42493e', fontStyle: 'italic', marginBottom: 16, lineHeight: 20 },
  viewMoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f4f3f1', paddingTop: 12 },
  viewMoreText: { fontSize: 12, fontWeight: '600', color: COLORS.outlineVariant, textTransform: 'uppercase', letterSpacing: 0.5 }
});