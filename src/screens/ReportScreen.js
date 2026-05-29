// src/screens/ReportScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Image,
  StatusBar, Alert, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  inputFill: '#F8F9FA',     // 🚀 NEW: Clean grey for form inputs!
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  pinkRed: '#FF564F',       // Used for SOS actions
  blueSea: '#00A7E7',
  orangeShine: '#FF912C',
};

const HEADER_HEIGHT = 60; 

const INCIDENT_TYPES = [
  'Medical Emergency', 
  'Accident / Injury', 
  'Mother & Newborns', 
  'Starving / Neglect', 
  'Abuse'
];

const ANIMAL_TYPES = [
  { label: 'Dog', icon: 'dog' },
  { label: 'Cat', icon: 'cat' },
  { label: 'Bird', icon: 'bird' },
  { label: 'Livestock', icon: 'cow' },
  { label: 'Wildlife', icon: 'leaf' },
  { label: 'Other', icon: 'paw' },
];

export default function ReportScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 

  const [incidentType, setIncidentType] = useState('Medical Emergency');
  const [animalType, setAnimalType] = useState('Dog');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (uri) => {
    const cloudName = "dorhbk11x"; 
    const uploadPreset = "strayconnect_uploads"; 

    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'report.jpg' });
    formData.append('upload_preset', uploadPreset);
    
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.secure_url;
  };

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) {
      Alert.alert(
        'Verification Required', 
        'Please verify your email address before submitting an incident report. Check your Profile tab to resend the link if needed.'
      );
      return; 
    }

    if (!location.trim()) {
      Alert.alert('Missing info', 'Please enter a location.'); return;
    }
    if (photos.length === 0) {
      Alert.alert('Missing photo', 'Please add at least one photo.'); return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = await Promise.all(photos.map(uploadToCloudinary));

      await addDoc(collection(db, 'reports'), {
        incidentType,
        animalType,
        location,
        description,
        contact,
        photoUrls: uploadedUrls,
        imageUrl: uploadedUrls[0],
        status: 'pending', 
        createdAt: new Date(),
        createdBy: currentUser.uid, 
      });

      Alert.alert(
        '✅ Report Submitted',
        'Thank you! The sanctuary has been alerted and a team will review the dispatch requirements.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 CUSTOM TOPOGRAPHIC BACKGROUND */}
      <Image 
        source={require('../../assets/images/app-bg.png')} 
        style={styles.bgPattern} 
      />

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report SOS</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 10 } 
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <Text style={styles.pageTitle}>Animal in Need</Text>
          <Text style={styles.pageSubtitle}>
            Provide details to help us locate and assist the animal safely. <Text style={{color: COLORS.pinkRed}}>✦</Text>
          </Text>

          {/* 📸 PHOTOS CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Upload Photos *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="camera-plus" size={28} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="image-multiple" size={28} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>Gallery</Text>
                </TouchableOpacity>
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                      <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.pinkRed} />
                    </TouchableOpacity>
                    <Image source={{ uri }} style={styles.thumbImage} />
                  </View>
                ))}
              </View>
            </ScrollView>
            {photos.length > 0 && (
              <Text style={styles.photoCount}>{photos.length} photo{photos.length > 1 ? 's' : ''} selected</Text>
            )}
          </View>

          {/* 🚨 INCIDENT TYPE CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Incident Type</Text>
            <View style={styles.toggleRow}>
              {INCIDENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleBtn, incidentType === type && styles.toggleBtnActive]}
                  onPress={() => setIncidentType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, incidentType === type && styles.toggleTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 🐾 ANIMAL TYPE CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Animal Type</Text>
            <View style={styles.animalTypeRow}>
              {ANIMAL_TYPES.map(({ label, icon }) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.animalTypeBtn, animalType === label && styles.animalTypeBtnActive]}
                  onPress={() => setAnimalType(label)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={animalType === label ? COLORS.surface : COLORS.textMuted}
                  />
                  <Text style={[styles.animalTypeText, animalType === label && styles.animalTypeTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 📍 LOCATION CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Location *</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.blueSea} />
              <TextInput
                style={styles.input}
                placeholder="Search address or landmark..."
                placeholderTextColor={COLORS.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* 📝 DESCRIPTION CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe the animal's appearance, behavior, or any visible injuries..."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* 📞 CONTACT CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Contact Number</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>🇱🇰 +94</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="7X XXX XXXX"
                placeholderTextColor={COLORS.textMuted}
                value={contact}
                onChangeText={setContact}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ℹ️ INFO BANNER */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons name="ambulance" size={24} color={COLORS.blueSea} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Rapid Response</Text>
              <Text style={styles.infoText}>
                Your report goes directly to the sanctuary dashboard. Admins can dispatch volunteers or a rescue unit based on severity.
              </Text>
            </View>
          </View>

          {/* 🚀 SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Text style={styles.submitText}>Submit Report</Text>
                <MaterialCommunityIcons name="alert-rhombus" size={20} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.submitNote}>High-priority cases are reviewed immediately.</Text>
          <View style={{ height: Math.max(insets.bottom + 20, 60) }} /> 

        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // 🚀 New Background Image Style
  bgPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
    resizeMode: 'cover',
  },

  header: { 
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.background, 
    zIndex: 100 
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  
  // 🚀 Typography
  headerTitle: { fontFamily: 'Poppins_900Black', fontSize: 20, color: COLORS.primary, letterSpacing: -0.5 },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  
  pageTitle: { fontFamily: 'Poppins_900Black', fontSize: 32, color: COLORS.primary, letterSpacing: -1, marginBottom: 4 },
  pageSubtitle: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 14, color: COLORS.primary, marginBottom: 24 },
  
  // Cards
  card: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 14, color: COLORS.primary, marginBottom: 12, letterSpacing: -0.3 },
  
  // Photos
  photoRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  addPhotoBtn: { width: 88, height: 96, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(0, 52, 89, 0.2)', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F8', gap: 6 },
  addPhotoText: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 11, color: COLORS.primary },
  photoThumb: { width: 88, height: 96, borderRadius: 16, backgroundColor: COLORS.background, position: 'relative' },
  thumbImage: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
  removePhoto: { position: 'absolute', top: -8, right: -8, zIndex: 10, backgroundColor: COLORS.surface, borderRadius: 999 },
  photoCount: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 12, color: COLORS.primary, marginTop: 12 },
  
  // Toggles / Chips
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.inputFill, borderWidth: 1, borderColor: COLORS.border },
  toggleBtnActive: { backgroundColor: COLORS.pinkRed, borderColor: COLORS.pinkRed },
  toggleText: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 13, color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.surface },
  
  // Animal Type
  animalTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  animalTypeBtn: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, backgroundColor: COLORS.inputFill, borderWidth: 1, borderColor: COLORS.border },
  animalTypeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  animalTypeText: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 13, color: COLORS.textMuted },
  animalTypeTextActive: { color: COLORS.surface },
  
  // Inputs (Fixed Backgrounds)
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputFill, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  input: { flex: 1, fontFamily: 'Urbanist_600SemiBold', fontSize: 15, color: COLORS.textDark },
  prefix: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 15, color: COLORS.primary },
  textarea: { backgroundColor: COLORS.inputFill, borderRadius: 16, padding: 16, fontFamily: 'Urbanist_600SemiBold', fontSize: 15, color: COLORS.textDark, minHeight: 120, borderWidth: 1, borderColor: COLORS.border },
  
  // Info Card
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  infoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 15, color: COLORS.primary, marginBottom: 4, letterSpacing: -0.3 },
  infoText: { fontFamily: 'Urbanist_600SemiBold', fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  
  // Submit Button
  submitBtn: { backgroundColor: COLORS.pinkRed, borderRadius: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: COLORS.pinkRed, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  submitText: { fontFamily: 'Urbanist_800ExtraBold', color: COLORS.surface, fontSize: 16, letterSpacing: -0.3 },
  submitNote: { fontFamily: 'Urbanist_600SemiBold', textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 16 },
});