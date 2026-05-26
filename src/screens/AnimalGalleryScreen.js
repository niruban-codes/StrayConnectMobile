// src/screens/AnimalGalleryScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Image, TextInput, FlatList, StatusBar, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 ADD INSETS HOOK
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
  
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

const HEADER_HEIGHT = 60; // 🚀 SET FIXED HEIGHT

const FILTERS = ['All', 'Dogs', 'Cats', 'Adoptable', 'Lost & Found'];

const statusStyle = (status) => {
  switch (status) {
    case 'adopted':   return { bg: '#E8F5E9', text: COLORS.greenLight, label: 'Adopted' };
    case 'sheltered': return { bg: '#E1F5FE', text: COLORS.blueSea, label: 'Sheltered' };
    case 'lost':      return { bg: '#FFEBEE', text: COLORS.pinkRed, label: 'Missing SOS' };
    default:          return { bg: '#FFF3E0', text: COLORS.orangeShine, label: 'Stray' };
  }
};

export default function AnimalGalleryScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Trigger Entrance Animation
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
    const safeName = a.name || '';
    const safeId = a.animalId || '';
    
    const matchesSearch =
      safeName.toLowerCase().includes(search.toLowerCase()) ||
      safeId.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'Dogs':      return a.species?.toLowerCase() === 'dog';
        case 'Cats':      return a.species?.toLowerCase() === 'cat';
        case 'Adoptable': return a.status === 'sheltered' || a.status === 'stray';
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
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AnimalDetail', { animal: item })}
      >
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderBg]}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.textMuted} />
            </View>
          )}
          
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{item.animalId || '—'}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Unnamed Pet'}</Text>
          
          <View style={styles.cardDetailsRow}>
            <Text style={styles.cardDetailText}>Gene: <Text style={{fontWeight: '700', color: COLORS.textMuted}}>{item.species}</Text></Text>
            <Text style={styles.cardDetailDot}>•</Text>
            <Text style={styles.cardDetailText}>Loc: <Text style={{fontWeight: '700', color: COLORS.textMuted}}>{item.location || 'Unknown'}</Text></Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
            
            {item.isVerified && (
              <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.blueSea} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    // 🚀 USE VIEW WITH INSETS INSTEAD OF SAFEAREAVIEW
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🌟 SCROLLING HEADER */}
      <Animated.View style={[
        styles.header, 
        { 
          paddingTop: insets.top, // Add inset top
          height: HEADER_HEIGHT + insets.top, // Increase height to fit inset
          transform: [{ translateY: headerTranslateY }] 
        }
      ]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="paw" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Directory</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialCommunityIcons name="tune-variant" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + insets.top + 10 }]} // 🚀 PUSH FEED DOWN
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* 🚀 ANIMATED WRAPPER */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* 🌟 PAGE TITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Find a Companion</Text>
            <Text style={styles.pageSubtitle}>Every pet deserves a good home. <Text style={{color: COLORS.pinkRed}}>✦</Text></Text>
          </View>

          {/* 🌟 SEARCH BAR */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color={COLORS.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or SC ID..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* 🌟 FILTER CHIPS */}
          <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>

          {/* 🌟 GRID / EMPTY STATES */}
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="paw-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
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
              scrollEnabled={false} // Important: Scroll handled by parent ScrollView
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}

        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // 🌟 Absolute Header for Collapsing Effect
  header: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.background, // Match background to hide content under it
    zIndex: 100 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  headerBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  
  scrollContent: { paddingHorizontal: 20 }, // Top padding injected dynamically
  
  // Titles
  titleSection: { marginBottom: 24 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  pageSubtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  clearBtn: { padding: 4 },
  
  // Filters
  filterRow: { gap: 10, paddingBottom: 8, marginBottom: 24 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  filterTextActive: { color: COLORS.surface },
  
  // Grid
  gridRow: { gap: 16, marginBottom: 16 },
  
  // Monito Style Cards
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardImageContainer: { width: '100%', height: 150, padding: 8, paddingBottom: 0 },
  cardImage: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  placeholderBg: { backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  idBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  idText: { color: COLORS.primary, fontSize: 9, fontWeight: '800' },
  
  // Card Text Info
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 6, letterSpacing: -0.3 },
  
  cardDetailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardDetailText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', flexShrink: 1 },
  cardDetailDot: { fontSize: 10, color: COLORS.border, marginHorizontal: 4 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // Empty States
  loadingState: { paddingVertical: 60, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
});