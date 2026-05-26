// src/screens/AlertDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, Dimensions, Alert, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 CHANGED IMPORT
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// 🎨 "MONITO" COLOR PALETTE
const COLORS = {
  primary: '#003459',       // Dark Blue
  secondary: '#F7DBA7',     // Mon Yellow
  background: '#FDFDFD',    // Neutral 00
  surface: '#FFFFFF',       // Pure White
  border: '#EBEEEF',        // Neutral 10
  textDark: '#00171F',      // Neutral 100
  textMuted: '#667479',     // Neutral 60
  
  // State Colors
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

export default function AlertDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS
  const { alertItem: initialAlert } = route.params;
  
  const [alertItem, setAlertItem] = useState(initialAlert);
  const [submitting, setSubmitting] = useState(false);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    // 🚀 ENTRANCE ANIMATION
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    const unsub = onSnapshot(doc(db, 'reports', initialAlert.id), (docSnap) => {
      if (docSnap.exists()) {
        setAlertItem({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [initialAlert.id]);

  const photos = alertItem.photoUrls && alertItem.photoUrls.length > 0 
    ? alertItem.photoUrls 
    : [alertItem.imageUrl];

  const currentUser = auth.currentUser;

  const handleHelpAction = () => {
    if (!currentUser) {
      Alert.alert("Login Required", "You must be logged in to respond to SOS alerts.");
      return;
    }

    Alert.alert(
      "Commit to Rescue? 🚨",
      `Are you confirming you can head to ${alertItem.location} right now? \n\nWe will alert the sanctuary that you are handling this.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "I'm on my way!", 
          style: "default",
          onPress: async () => {
            setSubmitting(true);
            try {
              await updateDoc(doc(db, 'reports', alertItem.id), {
                status: 'in_progress',
                helperId: currentUser.uid,
                helperName: currentUser.displayName || 'Community Member',
                respondedAt: new Date()
              });
            } catch (error) {
              Alert.alert("Error", "Could not assign rescue. Please try again.");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleUploadProof = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access to upload proof.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      
      if (!result.canceled) {
        setSubmitting(true);
        const imageUri = result.assets[0].uri;

        const formData = new FormData();
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'proof.jpg' });
        formData.append('upload_preset', 'strayconnect_uploads');
        
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/dorhbk11x/image/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        await updateDoc(doc(db, 'reports', alertItem.id), {
          status: 'reviewing',
          proofImageUrl: res.data.secure_url,
          completedAt: new Date()
        });

        Alert.alert("Proof Submitted! 🎉", "Thank you! An admin will review the photo and officially close this SOS ticket.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload proof. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBottomAction = () => {
    if (alertItem.status === 'pending') {
      return (
        <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={handleHelpAction} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <>
            <MaterialCommunityIcons name="run-fast" size={22} color="#fff" />
            <Text style={styles.btnText}>I can help with this right now</Text>
          </>}
        </TouchableOpacity>
      );
    }

    if (alertItem.status === 'in_progress' && alertItem.helperId === currentUser?.uid) {
      return (
        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleUploadProof} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <>
            <MaterialCommunityIcons name="camera-check" size={22} color="#fff" />
            <Text style={styles.btnText}>Upload Proof of Rescue</Text>
          </>}
        </TouchableOpacity>
      );
    }

    if (alertItem.status === 'in_progress' && alertItem.helperId !== currentUser?.uid) {
      return (
        <View style={[styles.btn, styles.disabledBtn]}>
          <MaterialCommunityIcons name="account-clock" size={20} color={COLORS.textMuted} />
          <Text style={[styles.btnText, { color: COLORS.textMuted }]}>Someone is already on the way</Text>
        </View>
      );
    }

    if (alertItem.status === 'reviewing') {
      return (
        <View style={[styles.btn, styles.reviewingBtn]}>
          <MaterialCommunityIcons name="shield-search" size={20} color={COLORS.blueSea} />
          <Text style={[styles.btnText, { color: COLORS.blueSea }]}>Proof Under Admin Review</Text>
        </View>
      );
    }

    if (alertItem.status === 'resolved') {
      return (
        <View style={[styles.btn, styles.resolvedBtn]}>
          <MaterialCommunityIcons name="check-decagram" size={20} color={COLORS.greenLight} />
          <Text style={[styles.btnText, { color: COLORS.greenLight }]}>Rescue Verified & Resolved</Text>
        </View>
      );
    }

    return null;
  };

  return (
    // 🚀 APPLY INSETS TO FIX LAYOUT
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🌟 PREMIUM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {/* 🌟 EDGE-TO-EDGE HERO SLIDER */}
          <View style={styles.sliderContainer}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {photos.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.sliderImage} />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.sliderBadge}>
                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={14} color="#fff" />
                <Text style={styles.sliderBadgeText}>Swipe for more</Text>
              </View>
            )}
          </View>

          {/* 🌟 CONTENT BODY */}
          <View style={styles.content}>
            <View style={styles.metaRow}>
              <View style={styles.typeBadge}>
                <MaterialCommunityIcons name="alert-octagon" size={14} color="#fff" />
                <Text style={styles.typeBadgeText}>{alertItem.incidentType}</Text>
              </View>
              <Text style={styles.timeText}>
                {alertItem.createdAt?.toDate ? alertItem.createdAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </Text>
            </View>

            <Text style={styles.title}>{alertItem.animalType} in Danger</Text>
            
            {/* 🌟 MONITO STYLE INFO CARD */}
            <View style={styles.infoBox}>
              <View style={styles.infoIconBg}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={COLORS.orangeShine} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Last Known Location</Text>
                <Text style={styles.infoValue}>{alertItem.location}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{alertItem.description}</Text>

          </View>
        </ScrollView>
      </Animated.View>

      {/* 🌟 FLOATING ACTION BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 16, 36) }]}>
        {renderBottomAction()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.secondary }, // Sets yellow behind status bar
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: COLORS.secondary },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  
  // Image Slider
  sliderContainer: { position: 'relative', width: width, height: width * 0.9, backgroundColor: COLORS.border, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  sliderImage: { width: width, height: '100%', resizeMode: 'cover' },
  sliderBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,34,50,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sliderBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  // Content Layout
  content: { padding: 24, paddingTop: 32 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.pinkRed, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  
  title: { fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 24, letterSpacing: -1, lineHeight: 36 },
  
  // Monito Style Info Box
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  infoIconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.3 },
  
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 12, letterSpacing: -0.5 },
  description: { fontSize: 15, color: COLORS.textMuted, lineHeight: 24, fontWeight: '500' },
  
  // Bottom Action Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 10 },
  
  // Buttons
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 999, gap: 8 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  
  dangerBtn: { backgroundColor: COLORS.pinkRed, shadowColor: COLORS.pinkRed, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  primaryBtn: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  
  // Status Indicator Buttons
  disabledBtn: { backgroundColor: COLORS.border },
  reviewingBtn: { backgroundColor: '#E1F5FE' },
  resolvedBtn: { backgroundColor: '#E8F5E9' },
});