import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, FlatList, SafeAreaView, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  primaryContainer: '#2d5a27',
  primaryFixed: '#bcf0ae',
  background: '#faf9f6',
  surface: '#ffffff',
  surfaceContainer: '#efeeeb',
  surfaceContainerLow: '#f4f3f1',
  surfaceContainerHigh: '#e9e8e5',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  error: '#ba1a1a',
  amber: '#d97706',
  blue: '#2563eb',
};

export default function HomeScreen({ navigation }) {
  const [recentAnimals, setRecentAnimals] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'animals'),
      orderBy('addedAt', 'desc'),
      limit(6)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsubscribe();
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'adopted':   return { bg: '#bcf0ae', text: '#002201' };
      case 'sheltered': return { bg: '#ccebc7', text: '#506b4f' };
      default:          return { bg: '#ffddb2', text: '#624000' };
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="paw" size={26} color={COLORS.primary} />
          <Text style={styles.logo}>StrayConnect</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.section}>
          <Text style={styles.greeting}>Hello, Friend! 🐾</Text>
          <Text style={styles.subGreeting}>Welcome to your digital sanctuary.</Text>
        </View>

        {/* Emergency Rescue Banner */}
        <TouchableOpacity style={styles.emergencyBanner} activeOpacity={0.85}>
          <View style={styles.emergencyLeft}>
            <MaterialCommunityIcons name="alert-circle" size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.emergencyTitle}>Emergency Rescue</Text>
              <Text style={styles.emergencySubtitle}>Report an animal in immediate danger</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Report')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#bcf0ae' }]}>
              <MaterialCommunityIcons name="camera" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Report a Stray</Text>
            <Text style={styles.actionSub}>Help an animal nearby</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Browse')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ccebc7' }]}>
              <MaterialCommunityIcons name="paw" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Browse Adoptions</Text>
            <Text style={styles.actionSub}>Find a forever friend</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Rescued */}
        <Text style={styles.sectionTitle}>Recently Rescued</Text>

        {recentAnimals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="paw-outline" size={40} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>No animals registered yet</Text>
          </View>
        ) : (
          <FlatList
            data={recentAnimals}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingRight: 20 }}
            renderItem={({ item }) => {
              const sc = statusColor(item.status);
              return (
                <TouchableOpacity
                  style={styles.animalCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Browse')}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.animalImage}
                    />
                  ) : (
                    <View style={[styles.animalImage, styles.animalImagePlaceholder]}>
                      <MaterialCommunityIcons name="paw-outline" size={32} color={COLORS.outlineVariant} />
                    </View>
                  )}
                  <View style={styles.animalInfo}>
                    <View style={styles.animalRow}>
                      <Text style={styles.animalName} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.animalMeta} numberOfLines={1}>
                      {item.species} · {item.location || 'Unknown'}
                    </Text>
                    <View style={styles.idBadge}>
                      <Text style={styles.idText}>{item.animalId || '—'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Community Actions */}
        <Text style={styles.sectionTitle}>Get Involved</Text>
        <View style={styles.communityActions}>
          {[
            { icon: 'map-marker-outline', label: 'Find Help Near You', sub: 'Locate vets and shelters' },
            { icon: 'account-group-outline', label: 'Join a Volunteer Group', sub: 'Connect with communities' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.communityCard} activeOpacity={0.8}>
              <View style={styles.communityIcon}>
                <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.communityLabel}>{item.label}</Text>
                <Text style={styles.communitySub}>{item.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#faf9f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(250,249,246,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194,201,187,0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontWeight: '800',
    fontSize: 18,
    color: '#154212',
    letterSpacing: -0.3,
  },
  notifBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 24 },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: '#42493e',
    marginTop: 4,
  },
  emergencyBanner: {
    backgroundColor: '#154212',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#154212',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c1a',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: '#42493e',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    marginBottom: 28,
  },
  emptyText: {
    color: '#42493e',
    fontSize: 13,
  },
  animalCard: {
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 28,
  },
  animalImage: {
    width: '100%',
    height: 110,
  },
  animalImagePlaceholder: {
    backgroundColor: '#efeeeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalInfo: {
    padding: 10,
  },
  animalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  animalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#154212',
    flex: 1,
    marginRight: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  animalMeta: {
    fontSize: 11,
    color: '#42493e',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  idBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  idText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  communityActions: {
    gap: 10,
    marginBottom: 8,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f3f1',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  communityIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#bcf0ae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c1a',
  },
  communitySub: {
    fontSize: 12,
    color: '#42493e',
    marginTop: 1,
  },
});