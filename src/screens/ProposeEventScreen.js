// src/screens/ProposeEventScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Image, StatusBar, Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  blueSea: '#00A7E7',
  orangeShine: '#FF912C',
};

export default function ProposeEventScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Awareness Program');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !date) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Authentication Error', 'You must be logged in to host an event.');
        setSubmitting(false);
        return;
      }

      let uploadedUrl = null;

      // 1. Upload Poster to Cloudinary if selected
      if (imageUri) {
        const formData = new FormData();
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'event_poster.jpg' });
        formData.append('upload_preset', 'strayconnect_uploads');
        
        const res = await axios.post(`https://api.cloudinary.com/v1_1/dorhbk11x/image/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrl = res.data.secure_url;
      }

      // 🚀 BUG FIX: Safely try to parse the date.
      const parsedDate = new Date(date);
      const safeFirebaseDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      // 2. Save Application to Firestore as PENDING
      await addDoc(collection(db, 'events'), {
        title,
        type,
        description,
        location,
        dateString: date, 
        date: safeFirebaseDate, 
        imageUrl: uploadedUrl,
        organizer: currentUser.displayName || 'Community Member',
        userId: currentUser.uid,
        status: 'pending', 
        createdAt: new Date(),
      });

      Alert.alert(
        'Application Submitted! 🎉',
        'Thank you! An admin will review your event details. You will receive a notification once it is approved and published to the community feed.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("EVENT SUBMISSION ERROR: ", error); 
      Alert.alert('Error', 'Failed to submit event application: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 CUSTOM TOPOGRAPHIC BACKGROUND */}
      <Image 
        source={require('../../assets/images/app-bg.png')} 
        style={styles.bgPattern} 
      />

      {/* 🌟 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Host an Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 60) }]} 
        showsVerticalScrollIndicator={false}
      >
        
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <View style={styles.infoBox}>
            <View style={styles.infoIconBg}>
              <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.blueSea} />
            </View>
            <Text style={styles.infoText}>All events are reviewed by admins before being published to the community to ensure safety and relevance.</Text>
          </View>

          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name="image-plus" size={40} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.placeholderText}>Upload Event Poster (Optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Event Title *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Beach Rescue Drive" 
            placeholderTextColor={COLORS.textMuted}
            value={title} 
            onChangeText={setTitle} 
          />

          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeRow}>
            {['Vaccination', 'Rescue', 'Awareness', 'Fundraiser'].map(t => (
              <TouchableOpacity 
                key={t} 
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeText, type === t && {color: COLORS.surface}]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date & Time *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. October 20th at 10:00 AM" 
            placeholderTextColor={COLORS.textMuted}
            value={date} 
            onChangeText={setDate} 
          />

          <Text style={styles.label}>Location *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Mount Lavinia Beach" 
            placeholderTextColor={COLORS.textMuted}
            value={location} 
            onChangeText={setLocation} 
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Tell people what the event is about and what they should bring..." 
            placeholderTextColor={COLORS.textMuted}
            multiline 
            numberOfLines={4} 
            value={description} 
            onChangeText={setDescription} 
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
            {submitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.submitText}>Submit Application</Text>
            )}
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // 🚀 Background Pattern
  bgPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
    resizeMode: 'cover',
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  
  // 🚀 Typography Updates
  headerTitle: { fontFamily: 'Poppins_900Black', fontSize: 18, color: COLORS.primary, letterSpacing: -0.5 },
  
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  infoBox: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  infoIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontFamily: 'Urbanist_500Medium', fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  
  imagePicker: { width: '100%', height: 180, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(0, 52, 89, 0.2)' },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontFamily: 'Urbanist_800ExtraBold', color: COLORS.primary, fontSize: 13, opacity: 0.7 },
  
  label: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 14, color: COLORS.primary, marginBottom: 8, marginTop: 12, letterSpacing: -0.3 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, fontFamily: 'Urbanist_600SemiBold', fontSize: 15, color: COLORS.textDark, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 13, color: COLORS.textMuted },
  
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 20, borderRadius: 16, alignItems: 'center', marginTop: 32, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitText: { fontFamily: 'Urbanist_800ExtraBold', color: COLORS.surface, fontSize: 16, letterSpacing: -0.3 }
});