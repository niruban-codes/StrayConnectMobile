import ReportMapAction from '../components/ReportMapAction';
import PhotoPreview from '../components/PhotoPreview';
import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
// src/screens/AlertDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, Dimensions, Alert, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { doc, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore';

import { transitionRescue } from '../utils/rescueTransition';

const { width } = Dimensions.get('window');

const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

export default function AlertDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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
    : [alertItem.imageUrl].filter(Boolean);

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
              await runTransaction(db, tx => transitionRescue(tx, doc(db, 'reports', alertItem.id),
                'claim', { uid: currentUser.uid, name: currentUser.displayName }, serverTimestamp()));
            } catch (error) {
              Alert.alert("Error", error.message || "Could not assign rescue. Please try again.");
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

        await runTransaction(db, tx => transitionRescue(tx, doc(db, 'reports', alertItem.id),
          'proof', { uid: auth.currentUser?.uid }, serverTimestamp(), res.data.secure_url));

        Alert.alert("Proof Submitted! 🎉", "Thank you! An admin will review the photo and officially close this SOS ticket.");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to upload proof. Please try again.");
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
                <PhotoPreview key={index} uri={url} photos={photos} initialIndex={index} style={styles.sliderImage} />
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
                <Text style={styles.typeBadgeText}>{alertItem.incidentType === 'Other' ? alertItem.incidentDetails || 'Other' : alertItem.incidentType}</Text>
              </View>
              <Text style={styles.timeText}>
                {alertItem.createdAt?.toDate ? alertItem.createdAt.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </Text>
            </View>

            <Text style={styles.title}>{alertItem.animalType === 'Other' ? alertItem.animalDetails || 'Other animal' : alertItem.animalType} in Danger</Text>

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

            <ReportMapAction report={alertItem} />
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{alertItem.description}</Text>

          </View>
        </ScrollView>
      </Animated.View>

      {/* 🌟 FLOATING ACTION BAR (Height Fixed!) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
        {renderBottomAction()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.secondary },

  // 🚀 Background Pattern

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: COLORS.secondary, borderBottomWidth: 3, borderBottomColor: palette.ink },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  headerTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },

  // Image Slider
  sliderContainer: { position: 'relative', width: width, height: width * 0.9, backgroundColor: COLORS.border, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden', borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  sliderImage: { width: width, height: '100%', resizeMode: 'cover' },
  sliderBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,34,50,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 0, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 3, borderColor: palette.ink },
  sliderBadgeText: { fontFamily: "Poppins_700Bold", color: '#fff', fontSize: 12 },

  // Content Layout
  content: { padding: 24, paddingTop: 32 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.pinkRed, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },
  typeBadgeText: { fontFamily: "Poppins_700Bold", color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.textMuted },

  title: { fontFamily: "Silkscreen_700Bold", fontSize: 26, color: COLORS.primary, marginBottom: 24, letterSpacing: 0, lineHeight: 36 },

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, padding: 16, borderRadius: 0, marginBottom: 32, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  infoIconBg: { width: 48, height: 48, borderRadius: 0, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.ink },
  infoLabel: { fontFamily: "Poppins_700Bold", fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.textDark, letterSpacing: -0.3 },

  sectionTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, marginBottom: 12, letterSpacing: 0 },
  description: { fontFamily: "Poppins_400Regular", fontSize: 15, color: COLORS.textMuted, lineHeight: 24 },

  // Bottom Action Bar (Reduced Height)
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, backgroundColor: COLORS.surface, borderTopWidth: 3, borderTopColor: palette.ink, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },

  // Buttons
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 0, gap: 8 },
  btnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: '#fff', letterSpacing: 0.3 },

  dangerBtn: { backgroundColor: COLORS.pinkRed, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  primaryBtn: { backgroundColor: COLORS.primary, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },

  // Status Indicator Buttons
  disabledBtn: { backgroundColor: COLORS.border },
  reviewingBtn: { backgroundColor: '#E1F5FE' },
  resolvedBtn: { backgroundColor: '#E8F5E9' },
});