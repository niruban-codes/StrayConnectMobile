import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from '../components/FeedError';
import PixelPet from '../components/PixelPet';
// src/screens/AnimalGalleryScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Image, TextInput, FlatList, StatusBar, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const COLORS = { ...ARCADE_COLORS, background: palette.mint };

const HEADER_HEIGHT = 60;

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
  const insets = useSafeAreaInsets();
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();
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
    outputRange: [0, -HEADER_HEIGHT], // Slides up completely
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
    }, error => { setLoading(false); failFeed(error); });
    return () => unsubscribe();
  }, [retryKey, failFeed]);

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
        case 'Adoptable': return a.isVerified && (a.status === 'sheltered' || a.status === 'stray');
        case 'Lost & Found': return a.status === 'stray' || a.status === 'lost';
        default:          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const renderCard = ({ item, index }) => {
    const sc = statusStyle(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: [palette.paper, palette.yellow, palette.pink, palette.purple][index % 4] }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AnimalDetail', { animal: item })}
      >
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderBg]}>
              <PixelPet size={100} />
            </View>
          )}

          <View style={styles.idBadge}>
            <Text style={styles.idText}>{item.animalId || '—'}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Unnamed Pet'}</Text>

          <View style={styles.cardDetailsRow}>
            <Text style={styles.cardDetailText}><Text style={{fontFamily: 'Poppins_700Bold', color: COLORS.textMuted}}>{item.species}</Text></Text>
            <Text style={styles.cardDetailText} numberOfLines={2}>{item.location || 'Location unknown'}</Text>
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

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />



      {/* 🚀 LAYER 1: SOLID BACKGROUND FOR STATUS BAR */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: insets.top,
        backgroundColor: COLORS.background,
        zIndex: 101
      }} />

      {/* 🚀 LAYER 2: ANIMATED HEADER */}
      <Animated.View style={[
        styles.header,
        {
          top: insets.top,
          height: HEADER_HEIGHT,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/sc-logo.png')}
            style={styles.headerLogoIcon}
          />
          <Text style={styles.headerTitle}>Directory</Text>
        </View>
        {/* 🚀 Removed the redundant filter button here! */}
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 10 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* 🌟 PAGE TITLE */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>FIND YOUR{'\n'}PLAYER TWO.</Text>
            <Text style={styles.pageSubtitle}>Real friends. Waiting for a fresh start.</Text>
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
              scrollEnabled={false}
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


  header: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: COLORS.background, zIndex: 100, borderBottomWidth: 3, borderBottomColor: palette.ink },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  headerLogoIcon: { width: 28, height: 28, resizeMode: 'contain', borderRadius: 0 },

  headerTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },

  scrollContent: { paddingHorizontal: 20 },

  // Titles
  titleSection: { marginBottom: 24 },
  pageTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 26, color: COLORS.primary, letterSpacing: 0 },
  pageSubtitle: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.primary, marginTop: 4 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 0, paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginBottom: 24, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  searchInput: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.textDark },
  clearBtn: { padding: 4 },

  // Filters
  filterRow: { gap: 10, paddingBottom: 8, marginBottom: 24 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 0, backgroundColor: palette.paper, borderWidth: 3, borderColor: palette.ink },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: palette.ink },
  filterText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.primary },
  filterTextActive: { color: COLORS.surface },

  // Grid
  gridRow: { gap: 16, marginBottom: 16 },

  card: { flex: 1, maxWidth: '48%', backgroundColor: COLORS.surface, borderRadius: 0, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  cardImageContainer: { width: '100%', height: 150, padding: 8, paddingBottom: 0 },
  cardImage: { width: '100%', height: '100%', borderRadius: 0, resizeMode: 'cover' },
  placeholderBg: { backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  idBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: palette.paper, borderRadius: 0, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 3, borderColor: palette.ink },
  idText: { fontFamily: "Poppins_700Bold", color: COLORS.primary, fontSize: 9 },

  // Card Text Info
  cardInfo: { padding: 10 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.primary, marginBottom: 6, letterSpacing: -0.3 },

  cardDetailsRow: { gap: 3, marginBottom: 12 },
  cardDetailText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  cardDetailDot: { fontSize: 10, color: COLORS.border, marginHorizontal: 4 },

  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 5, paddingVertical: 4 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 10, textTransform: 'uppercase' },

  // Empty States
  loadingState: { paddingVertical: 60, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  emptyTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },
  emptySubtitle: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
