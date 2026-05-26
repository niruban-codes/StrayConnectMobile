// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, 
  FlatList, StatusBar, Dimensions, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, query, limit, onSnapshot, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// 🎨 UPDATED "MONITO" COLOR PALETTE (Yellow Background)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - NEW MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  surfaceOff: '#FDFDFD',    // Neutral 00
  border: '#EBEEEF',        // Neutral 10
  textDark: '#00171F',      // Neutral 100
  textMuted: '#52616B',     // Darkened slightly for contrast against yellow
  
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

const HEADER_HEIGHT = 60; // Fixed height for our animated header

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 

  const [recentAnimals, setRecentAnimals] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // 🚀 ENTRANCE ANIMATION VALUES
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    const qAnimals = query(
      collection(db, 'animals'),
      where('status', 'in', ['stray', 'sheltered','lost']),
      limit(6)
    );
    const unsubAnimals = onSnapshot(qAnimals, (snapshot) => {
      setRecentAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const qEvents = query(
      collection(db, 'events'),
      where('status', '==', 'approved')
    );
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      fetchedEvents.sort((a, b) => (a.date?.toMillis() || 0) - (b.date?.toMillis() || 0));
      setUpcomingEvents(fetchedEvents);
    });

    return () => { unsubAnimals(); unsubEvents(); };
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'adopted':   return { bg: '#E8F5E9', text: COLORS.greenLight };
      case 'sheltered': return { bg: '#E1F5FE', text: COLORS.blueSea };
      case 'lost':      return { bg: '#FFEBEE', text: COLORS.pinkRed };
      default:          return { bg: '#FFF3E0', text: COLORS.orangeShine };
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 LAYER 1: SOLID BACKGROUND FOR STATUS BAR (Keeps clock readable) */}
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
          <MaterialCommunityIcons name="paw" size={28} color={COLORS.primary} />
          <Text style={styles.logo}>StrayConnect</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 10 } // Start feed below header
        ]} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* 🌟 GREETING */}
          <View style={styles.section}>
            <Text style={styles.greeting}>One More Friend</Text>
            <Text style={styles.subGreeting}>Thousands More Fun! <Text style={{color: COLORS.pinkRed}}>✦</Text></Text>
            <Text style={styles.greetingDesc}>
              Having a pet means you have more joy, a new friend, a happy person who will always be with you.
            </Text>
          </View>

          {/* 🌟 QUICK ACTIONS */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: COLORS.surface }]} 
              activeOpacity={0.8} 
              onPress={() => navigation.navigate('Report')}
            >
              <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Report Stray</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} 
              activeOpacity={0.8} 
              onPress={() => navigation.navigate('Browse')}
            >
              <Text style={[styles.actionBtnText, { color: COLORS.surface }]}>Explore Now</Text>
              <MaterialCommunityIcons name="chevron-right-circle" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          {/* 🌟 EMERGENCY BANNER */}
          <TouchableOpacity style={styles.emergencyBanner} activeOpacity={0.85}>
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIconBg}>
                <MaterialCommunityIcons name="alert-rhombus" size={24} color={COLORS.pinkRed} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.emergencyTitle}>Emergency Rescue</Text>
                <Text style={styles.emergencySubtitle}>Report an animal in immediate danger</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.pinkRed} />
          </TouchableOpacity>

          {/* 🌟 EXCITING EVENTS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>What's new?</Text>
            <Text style={styles.sectionTitle}>Exciting Events</Text>
          </View>
          
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming events right now.</Text>
            </View>
          ) : (
            <FlatList
              data={upcomingEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingRight: 20, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const eventDate = item.date?.toDate ? item.date.toDate() : new Date();
                const month = eventDate.toLocaleString('default', { month: 'short' });
                const day = eventDate.getDate();

                return (
                  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('EventDetail', { event: item })}>
                    <View style={styles.cardImageContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                      ) : (
                        <View style={[styles.cardImage, styles.placeholderBg]}>
                          <MaterialCommunityIcons name="calendar-star" size={32} color={COLORS.border} />
                        </View>
                      )}
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateMonth}>{month}</Text>
                        <Text style={styles.dateDay}>{day}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        <MaterialCommunityIcons name="map-marker" size={12} /> {item.location}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          )}

          {/* 🌟 RECENTLY RESCUED */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>Who's new?</Text>
            <Text style={styles.sectionTitle}>Take A Look At Our Pets</Text>
          </View>
          
          {recentAnimals.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="paw-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No animals registered yet</Text>
            </View>
          ) : (
            <FlatList
              data={recentAnimals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingRight: 20, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const sc = statusColor(item.status);
                return (
                  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('Browse')}>
                    <View style={styles.cardImageContainer}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                      ) : (
                        <View style={[styles.cardImage, styles.placeholderBg]}>
                          <MaterialCommunityIcons name="paw" size={32} color={COLORS.border} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Unnamed Pet'}</Text>
                      <View style={styles.cardDetailsRow}>
                        <Text style={styles.cardDetailText}>Gene: <Text style={{fontWeight: '700', color: COLORS.textMuted}}>{item.species}</Text></Text>
                        <Text style={styles.cardDetailDot}>•</Text>
                        <Text style={styles.cardDetailText}>Loc: <Text style={{fontWeight: '700', color: COLORS.textMuted}}>{item.location || 'Unknown'}</Text></Text>
                      </View>
                      
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* 🌟 GET INVOLVED */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>Join the mission</Text>
            <Text style={styles.sectionTitle}>Get Involved</Text>
          </View>

          <View style={styles.communityActions}>
            <TouchableOpacity style={styles.listCard} activeOpacity={0.8}>
              <View style={[styles.listIconBg, { backgroundColor: '#E1F5FE' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={COLORS.blueSea} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>Find Help Near You</Text>
                <Text style={styles.listSub}>Locate vets and shelters</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.listCard} activeOpacity={0.8} onPress={() => navigation.navigate('ProposeEvent')}>
              <View style={[styles.listIconBg, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="calendar-star" size={24} color={COLORS.orangeShine} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>Host an Event</Text>
                <Text style={styles.listSub}>Submit an event for admin approval</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
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
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.background,
    zIndex: 100 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { fontWeight: '900', fontSize: 22, color: COLORS.primary, letterSpacing: -0.5 },
  notifBtn: { position: 'relative', padding: 8 },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.pinkRed, borderWidth: 1.5, borderColor: COLORS.background },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Greeting Section
  section: { marginBottom: 24 },
  greeting: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: -1, lineHeight: 40 },
  subGreeting: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  greetingDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, lineHeight: 20, fontWeight: '500', paddingRight: 20 },
  
  // Quick Actions (Buttons)
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Emergency Banner
  emergencyBanner: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, borderWidth: 1, borderColor: '#FFE4E1', shadowColor: COLORS.pinkRed, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  emergencySubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' },
  
  // Section Headers
  sectionHeader: { marginBottom: 16 },
  sectionSubtitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  
  // Empty State (Adjusted for yellow bg)
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  
  // Monito Style Cards
  card: { width: 180, backgroundColor: COLORS.surface, borderRadius: 20, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardImageContainer: { width: '100%', height: 160, padding: 8 },
  cardImage: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  placeholderBg: { backgroundColor: COLORS.surfaceOff, alignItems: 'center', justifyContent: 'center' },
  
  // Card Text Info
  cardInfo: { padding: 12, paddingTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  cardSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  
  // Animal Specific Details
  cardDetailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardDetailText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  cardDetailDot: { fontSize: 10, color: COLORS.border, marginHorizontal: 6 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  
  // Event Specific Details
  dateBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  dateMonth: { fontSize: 9, fontWeight: '800', color: COLORS.pinkRed, textTransform: 'uppercase' },
  dateDay: { fontSize: 14, fontWeight: '900', color: COLORS.primary },

  // Get Involved Lists
  communityActions: { gap: 12 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  listIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },
  listSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
});