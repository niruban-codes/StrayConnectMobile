import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, TextInput, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  primaryFixed: '#bcf0ae',
  blue: '#2563eb',
  amber: '#d97706',
};

const FILTERS = ['All', 'Dogs', 'Cats', 'Adoptable', 'Lost & Found'];

const statusStyle = (status) => {
  switch (status) {
    case 'adopted':   return { bg: '#bcf0ae', text: '#002201', label: 'Adopted' };
    case 'sheltered': return { bg: '#ccebc7', text: '#506b4f', label: 'Sheltered' };
    case 'lost':      return { bg: '#ffdad6', text: '#ba1a1a', label: 'Missing SOS' };
    default:          return { bg: '#ffddb2', text: '#624000', label: 'Stray' };
  }
};

export default function AnimalGalleryScreen({ navigation }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const q = query(
  collection(db, 'animals'), 
  where('status', 'in', ['stray', 'sheltered', 'lost'])
);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = animals.filter(a => {
    const matchesSearch =
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.animalId?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'Dogs':      return a.species?.toLowerCase() === 'dog';
        case 'Cats':      return a.species?.toLowerCase() === 'cat';
        case 'Adoptable': return a.status === 'sheltered' || a.status === 'stray';
        // NEW: Show both strays AND lost owned pets here!
        case 'Lost & Found': return a.status === 'stray' || a.status === 'lost'; 
        default:          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const renderCard = ({ item }) => {
    const sc = statusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AnimalDetail', { animal: item })}
      >
        {/* Photo */}
        <View style={styles.photoContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <MaterialCommunityIcons name="paw-outline" size={32} color={COLORS.outlineVariant} />
            </View>
          )}
          {/* SC ID Badge */}
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{item.animalId || '—'}</Text>
          </View>
          {/* Verified Badge */}
          {item.isVerified ? (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-circle" size={10} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : (
            <View style={[styles.verifiedBadge, { backgroundColor: COLORS.amber }]}>
              <MaterialCommunityIcons name="clock-outline" size={10} color="#fff" />
              <Text style={styles.verifiedText}>Unverified</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={styles.animalName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>
          <Text style={styles.animalMeta} numberOfLines={1}>
            {item.species} · {item.breed || 'Unknown breed'}
          </Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.outlineVariant} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location || 'Unknown'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="paw" size={22} color={COLORS.primary} />
        <Text style={styles.headerTitle}>StrayConnect</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="tune-variant" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Find a Companion</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.outlineVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SC ID..."
            placeholderTextColor={COLORS.outlineVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grid */}
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="paw-outline" size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>No friends found here</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters or search terms.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf9f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(250,249,246,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194,201,187,0.3)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1c1a',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f4f3f1',
  },
  filterChipActive: {
    backgroundColor: '#154212',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42493e',
  },
  filterTextActive: {
    color: '#fff',
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photoContainer: {
    position: 'relative',
    height: 130,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#efeeeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  idText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
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
  },
  animalMeta: {
    fontSize: 11,
    color: '#42493e',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: '#72796e',
    flex: 1,
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#154212',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#42493e',
    textAlign: 'center',
    maxWidth: 220,
  },
});