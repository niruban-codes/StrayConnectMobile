import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
// src/screens/NotificationsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Animated, Image, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { notificationDetails } from '../utils/notificationDetails';

const COLORS = { ...ARCADE_COLORS, background: palette.paper };

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    const currentUser = auth.currentUser;
    if (!currentUser) { setLoading(false); return; }

    // Fetch alerts only for the logged-in user
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Sort newest to oldest locally (prevents Firestore Index errors!)
      notifs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

      setNotifications(notifs);
      setLoading(false);
    }, () => {
      setLoading(false);
      Alert.alert('Notifications unavailable', 'Please check your connection and try again.');
    });

    return () => unsubscribe();
  }, []);

  const markRead = async item => {
    if (item.isRead) return;
    try { await updateDoc(doc(db, 'notifications', item.id), { isRead: true }); }
    catch (error) { console.warn('Could not mark notification as read:', error.message); }
  };
  const openDirections = async item => {
    const details = notificationDetails(item);
    if (!details.directionsUrl) return;
    try {
      await Linking.openURL(details.directionsUrl);
      void markRead(item);
    } catch {
      Alert.alert('Unable to open maps', `Open your maps app and enter: ${item.latitude}, ${item.longitude}`);
    }
  };
  const handleNotificationPress = item => {
    const details = notificationDetails(item);
    const buttons = [{ text: 'Close', style: 'cancel' }];
    if (details.mapUrl) {
      buttons.push({ text: 'View pin', onPress: () => Linking.openURL(details.mapUrl).catch(() => {
        Alert.alert('Unable to open maps', `Coordinates: ${item.latitude}, ${item.longitude}`);
      }) });
      buttons.push({ text: 'Get directions', onPress: () => openDirections(item) });
    }
    Alert.alert(details.title, details.message, buttons);
    void markRead(item);
  };

  const renderItem = ({ item }) => (
    <View
      style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }, !item.isRead && styles.unreadCard]}
    >
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button" onPress={() => handleNotificationPress(item)}>
      <View style={[styles.iconBg, !item.isRead ? { backgroundColor: COLORS.primary } : { backgroundColor: '#EBEEEF' }]}>
        <MaterialCommunityIcons
          name={item.type === 'event_update' ? "calendar-star" : "map-marker-radius"}
          size={24}
          color={!item.isRead ? COLORS.surface : COLORS.textMuted}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>
          {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
      {notificationDetails(item).directionsUrl && <TouchableOpacity style={styles.directionsButton}
        accessibilityRole="button" accessibilityLabel="Get directions to this pet sighting" onPress={() => openDirections(item)}>
        <MaterialCommunityIcons name="directions" size={20} color={COLORS.surface} />
        <Text style={styles.directionsText}>Get directions to sighting</Text>
      </TouchableOpacity>}
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />



      {/* 🌟 PREMIUM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 🚀 ANIMATED FEED */}
      <Animated.View style={[styles.feedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={60} color={COLORS.primary} style={{ opacity: 0.2 }} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>You have no new notifications.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  directionsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: COLORS.primary, borderRadius: 0, marginTop: 12, borderWidth: 3, borderColor: palette.ink },
  directionsText: { color: COLORS.surface, fontWeight: '700', fontSize: 13 },
  safe: { flex: 1, backgroundColor: COLORS.background },

  // 🚀 Background Pattern

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, zIndex: 10 },
  backBtn: { padding: 8, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },

  // 🚀 Typography Updates
  headerTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },

  feedContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 12 },

  card: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 0, marginBottom: 12, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  unreadCard: { backgroundColor: COLORS.surface, borderColor: palette.ink },

  iconBg: { width: 52, height: 52, borderRadius: 0, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center' },

  // 🚀 Font Family Updates
  title: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.textDark, marginBottom: 4, letterSpacing: -0.3 },
  unreadText: { fontFamily: "Poppins_700Bold", color: COLORS.primary },
  message: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 6 },
  time: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  unreadDot: { width: 10, height: 10, borderRadius: 0, backgroundColor: COLORS.pinkRed, alignSelf: 'center', marginLeft: 12 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingVertical: 60, marginHorizontal: 20, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  emptyTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, marginTop: 16, letterSpacing: 0 },
  emptyText: { fontFamily: "Poppins_700Bold", marginTop: 4, fontSize: 14, color: COLORS.textMuted }
});
