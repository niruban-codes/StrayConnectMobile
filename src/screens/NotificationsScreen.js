// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  surface: '#ffffff',
  text: '#1a1c1a',
  textLight: '#73796e',
  unreadBackground: '#e8f0e4', // Light green to highlight unread alerts
  error: '#ba1a1a'
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

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
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationPress = async (item) => {
    // 1. Mark as read in Firestore
    if (!item.isRead) {
      const notifRef = doc(db, 'notifications', item.id);
      await updateDoc(notifRef, { isRead: true });
    }

    // 2. Show the exact GPS coordinates (Later we can open a map here!)
    Alert.alert(
      "Sighting Details", 
      `Coordinates:\nLat: ${item.latitude}\nLng: ${item.longitude}\n\nWe will add a Google Maps link here soon!`
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, !item.isRead && styles.unreadCard]} 
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name="map-marker-radius" 
          size={24} 
          color={!item.isRead ? COLORS.error : COLORS.textLight} 
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now'}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Feed */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-sleep-outline" size={60} color="#c2c9bb" />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.background, zIndex: 10 },
  backBtn: { padding: 8, backgroundColor: '#f4f3f1', borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  unreadCard: { backgroundColor: COLORS.unreadBackground, borderWidth: 1, borderColor: '#c3e0ba' },
  
  iconContainer: { marginRight: 16, justifyContent: 'center' },
  textContainer: { flex: 1, justifyContent: 'center' },
  
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  unreadText: { fontWeight: '800' },
  message: { fontSize: 14, color: COLORS.textLight, lineHeight: 20, marginBottom: 6 },
  time: { fontSize: 12, color: '#a0a69a' },
  
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.error, alignSelf: 'center', marginLeft: 8 },
  
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textLight }
});