import PhotoPreview from '../components/PhotoPreview';
import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
import { upcomingEvents as filterUpcomingEvents, eventStart } from '../utils/eventDate';
import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from '../components/FeedError';
import ArcadeButton from '../components/ArcadeButton';
import PetAvatar from '../components/PetAvatar';
// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  FlatList, StatusBar, Dimensions, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, query, limit, onSnapshot, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

const HEADER_HEIGHT = 60;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();

  const [recentAnimals, setRecentAnimals] = useState([]);
  const [events, setEvents] = useState([]);
  const [clock, setClock] = useState(() => new Date());
  const upcomingEvents = filterUpcomingEvents(events, clock);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(query(collection(db, 'notifications'), where('userId', '==', uid)), snapshot => {
      setUnreadCount(snapshot.docs.filter(item => !item.data().isRead).length);
    }, failFeed);
  }, [retryKey, failFeed]);

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
    outputRange: [0, -HEADER_HEIGHT],
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

    // ── FETCH ANIMALS ──
    const qAnimals = query(
      collection(db, 'animals'),
      where('status', 'in', ['stray', 'sheltered','lost']),
      limit(6)
    );
    const unsubAnimals = onSnapshot(qAnimals, (snapshot) => {
      setRecentAnimals(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, failFeed);

    // ── FETCH EVENTS (WITH AUTO-HIDE LOGIC) ──
    const qEvents = query(
      collection(db, 'events'),
      where('status', '==', 'approved')
    );

    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(item => ({ ...item.data(), id: item.id })));
    }, failFeed);

    return () => { unsubAnimals(); unsubEvents(); };
  }, [retryKey, failFeed]);

  const statusColor = (status) => {
    switch (status) {
      case 'adopted':   return { bg: '#E8F5E9', text: COLORS.greenLight };
      case 'sheltered': return { bg: '#E1F5FE', text: COLORS.blueSea };
      case 'lost':      return { bg: '#FFEBEE', text: COLORS.pinkRed };
      default:          return { bg: '#FFF3E0', text: COLORS.orangeShine };
    }
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
          {/* 🚀 CUSTOM APP LOGO */}
          <Image
            source={require('../../assets/images/sc-logo.png')}
            style={styles.headerLogoIcon}
          />
          <Text style={styles.logo}>StrayConnect</Text>
        </View>
        <TouchableOpacity accessibilityLabel={`Notifications, ${unreadCount} unread`} style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} />
          {unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
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

          {/* 🌟 GREETING */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>YOUR DAILY DOSE OF DOING GOOD</Text>
            <Text style={styles.greeting}>SMALL PAWS.{'\n'}BIG MISSION.</Text>
            <Text style={styles.greetingDesc}>
              A safer world for every stray. Start with one small act of care.
            </Text>
          </View>

          <View style={styles.petConsole}>
            <View style={styles.consoleTop}><Text style={styles.consoleLabel}>COMPANION / 01</Text><Text style={styles.consoleLabel}>♥ ♥ ♥</Text></View>
            <View style={styles.petStage}><PetAvatar size={190} /><View style={styles.petCaption}><Text style={styles.consoleLabel}>GOOD DOG.{'\n'}GREAT CAUSE.</Text></View></View>
            <View style={styles.consoleBottom}><Text style={styles.consoleLabel}>FIND. HELP. CONNECT.</Text></View>
          </View>
          <ArcadeButton color={palette.coral} style={{ marginBottom: 16 }} onPress={() => navigation.navigate('Report')}>REPORT SOS →</ArcadeButton>
          <ArcadeButton color={palette.mint} style={{ marginBottom: 28 }} onPress={() => navigation.navigate('Browse')}>MEET THE PETS →</ArcadeButton>
          {/* 🌟 EXCITING EVENTS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionSubtitle}>01 / SHOW UP FOR GOOD</Text>
            <Text style={styles.sectionTitle}>COMMUNITY EVENTS</Text>
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
                const eventDate = eventStart(item);
                const month = eventDate.toLocaleString('en-GB', { month: 'short', timeZone: 'Asia/Colombo' });
                const day = eventDate.toLocaleString('en-GB', { day: 'numeric', timeZone: 'Asia/Colombo' });

                return (
                  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('EventDetail', { event: item })}>
                    <View style={styles.cardImageContainer}>
                      {item.imageUrl ? (
                        <PhotoPreview uri={item.imageUrl} style={styles.cardImage} />
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
            <Text style={styles.sectionSubtitle}>02 / THE PAW PARADE</Text>
            <Text style={styles.sectionTitle}>MEET YOUR NEXT FRIEND</Text>
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
                        <PhotoPreview uri={item.imageUrl} style={styles.cardImage} />
                      ) : (
                        <View style={[styles.cardImage, styles.placeholderBg]}>
                          <MaterialCommunityIcons name="paw" size={32} color={COLORS.border} />
                        </View>
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Unnamed Pet'}</Text>
                      <View style={styles.cardDetailsRow}>
                        <Text style={styles.cardDetailText}>Species: <Text style={{fontFamily: 'Poppins_700Bold', color: COLORS.textMuted}}>{item.species}</Text></Text>
                        <Text style={styles.cardDetailText} numberOfLines={2}>{item.location || 'Location unknown'}</Text>
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
            <TouchableOpacity style={styles.listCard} activeOpacity={0.8} onPress={() => navigation.navigate('SOS Feed')}>
              <View style={[styles.listIconBg, { backgroundColor: '#E1F5FE' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={COLORS.blueSea} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>Local rescue alerts</Text>
                <Text style={styles.listSub}>See animals who need help</Text>
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
  petConsole: { borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.purple, boxShadow: '5px 5px 0px 0px #111111', marginBottom: 24 },
  consoleTop: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: palette.ink, padding: 12, backgroundColor: palette.paper },
  consoleLabel: { fontFamily: 'Silkscreen_700Bold', fontSize: 11, color: palette.ink, lineHeight: 18 },
  petStage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', paddingVertical: 8 },
  petCaption: { flexShrink: 1, padding: 8 },
  consoleBottom: { borderTopWidth: 3, borderColor: palette.ink, padding: 10, alignItems: 'center', backgroundColor: palette.paper },
  safe: { flex: 1, backgroundColor: COLORS.background },


  header: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: COLORS.background, zIndex: 100, borderBottomWidth: 3, borderBottomColor: palette.ink },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  headerLogoIcon: { width: 28, height: 28, resizeMode: 'contain', borderRadius: 0 },

  logo: { fontFamily: "Silkscreen_700Bold", fontSize: 18, color: COLORS.primary, letterSpacing: 0 },
  notifBtn: { position: 'relative', padding: 8 },
  notifBadge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 0, backgroundColor: COLORS.pinkRed, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.ink },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 0, backgroundColor: COLORS.pinkRed, borderWidth: 3, borderColor: palette.ink },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginBottom: 24 },
  greeting: { fontFamily: "Silkscreen_700Bold", fontSize: 29, color: COLORS.primary, letterSpacing: 0, lineHeight: 40 },
  subGreeting: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.primary, marginTop: 4 },
  greetingDesc: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted, marginTop: 12, lineHeight: 20, paddingRight: 20 },

  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 0, boxShadow: "4px 4px 0px 0px #111111" },
  actionBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, letterSpacing: 0.5 },

  emergencyBanner: { backgroundColor: '#FFF', borderRadius: 0, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyIconBg: { width: 44, height: 44, borderRadius: 0, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.ink },
  emergencyTitle: { fontFamily: "Poppins_700Bold", color: COLORS.primary, fontSize: 15 },
  emergencySubtitle: { fontFamily: "Poppins_400Regular", color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  sectionHeader: { marginBottom: 16 },
  sectionSubtitle: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  sectionTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8, marginBottom: 24, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  emptyText: { fontFamily: "Poppins_700Bold", color: COLORS.textMuted, fontSize: 13 },

  card: { width: 180, backgroundColor: COLORS.surface, borderRadius: 0, marginRight: 16, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  cardImageContainer: { width: '100%', height: 160, padding: 8 },
  cardImage: { width: '100%', height: '100%', borderRadius: 0, resizeMode: 'cover' },
  placeholderBg: { backgroundColor: COLORS.surfaceOff, alignItems: 'center', justifyContent: 'center' },

  cardInfo: { padding: 12, paddingTop: 4 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.primary, marginBottom: 6 },
  cardSub: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.textMuted },

  cardDetailsRow: { gap: 3, marginBottom: 10 },
  cardDetailText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  cardDetailDot: { fontSize: 10, color: COLORS.border, marginHorizontal: 6 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 0, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 10, textTransform: 'capitalize' },

  dateBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: palette.paper, borderRadius: 0, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', borderWidth: 3, borderColor: palette.ink },
  dateMonth: { fontFamily: "Poppins_700Bold", fontSize: 9, color: COLORS.pinkRed, textTransform: 'uppercase' },
  dateDay: { fontFamily: "Silkscreen_700Bold", fontSize: 14, color: COLORS.primary, letterSpacing: 0 },

  communityActions: { gap: 12 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.paper, borderRadius: 0, padding: 16, gap: 16, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  listIconBg: { width: 48, height: 48, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.primary, letterSpacing: -0.3 },
  listSub: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
