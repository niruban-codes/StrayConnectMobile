// src/screens/RegisterPetScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image, Alert, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 IMPORT INSETS
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  pinkRed: '#FF564F',
  blueSea: '#00A7E7',
  orangeShine: '#FF912C',
};

export default function RegisterPetScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState(''); 
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // 📸 1. Pick an Image from Camera Roll
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🚀 2. Submit to Cloudinary & Firestore
  const handleRegister = async () => {
    if (!name || !imageUri || !location) {
      Alert.alert('Missing Info', 'Please provide your pet\'s name, location, and a photo.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in.");

      const data = new FormData();
      data.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'pet_photo.jpg',
      });
      data.append('upload_preset', 'strayconnect_uploads');

      const cloudName = "dorhbk11x";
      const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(uploadURL, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
      });
      const uploadResult = await response.json();
      
      if (!uploadResult.secure_url) throw new Error("Image upload failed.");

      // B. Save to Firestore (The Critical Security Logic!)
      await addDoc(collection(db, 'animals'), {
        name,
        species: species.toLowerCase(),
        breed: breed || 'Unknown',
        age: age ? Number(age) : null,
        sex: sex.toLowerCase(),
        imageUrl: uploadResult.secure_url,
        ownerContact: contact,
        location: location, 
        
        // THE TRUST PIPELINE:
        status: 'owned',           // Prevents adoption routing
        isVerified: false,         // Requires Vet approval
        ownerId: currentUser.uid,  // Links to the user's Profile
        
        addedAt: new Date(),
        vaccinations: [],
        medicalHistory: []
      });

      Alert.alert(
        'Registration Submitted! 🐾', 
        'Your pet is now pending Vet Verification. Visit a registered StrayConnect vet to get your official SC-ID and collar!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚀 USE VIEW WITH INSETS TO FIX LAYOUT GLITCH
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* 🌟 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register My Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 60) }]} // 🚀 BOTTOM INSET
        showsVerticalScrollIndicator={false}
      >
        
        {/* 🚀 ANIMATED WRAPPER */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <View style={styles.infoBanner}>
            <View style={styles.infoIconBg}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={COLORS.blueSea} />
            </View>
            <Text style={styles.bannerText}>
              Self-registered pets will be marked as <Text style={{fontWeight: '800', color: COLORS.primary}}>Pending Verification</Text> until examined by a registered Vet.
            </Text>
          </View>

          {/* Photo Upload */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={40} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.imagePlaceholderText}>Add Pet Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Inputs */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Bella" placeholderTextColor={COLORS.textMuted} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Emergency Contact Number</Text>
            <TextInput 
              style={styles.input} 
              value={contact} 
              onChangeText={setContact} 
              placeholder="e.g., 077 123 4567" 
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textMuted} 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>City / Area *</Text>
            <TextInput 
              style={styles.input} 
              value={location} 
              onChangeText={setLocation} 
              placeholder="e.g., Colombo 07" 
              placeholderTextColor={COLORS.textMuted} 
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Species</Text>
            <View style={[styles.pillRow, { flexWrap: 'wrap' }]}>
              {['Dog', 'Cat', 'Bird', 'Rabbit', 'Reptile', 'Livestock', 'Other'].map(s => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.pill, species === s && styles.pillActive]} 
                  onPress={() => setSpecies(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, species === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Breed / Mix (Optional)</Text>
            <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="e.g., Golden Retriever" placeholderTextColor={COLORS.textMuted} />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Age (Years)</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="e.g., 2" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
            </View>
            <View style={[styles.formGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.pillRow}>
                {['Male', 'Female'].map(s => (
                  <TouchableOpacity key={s} style={[styles.pill, { flex: 1, alignItems: 'center' }, sex === s && styles.pillActive]} onPress={() => setSex(s)} activeOpacity={0.8}>
                    <Text style={[styles.pillText, sex === s && styles.pillTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Registration</Text>
                <MaterialCommunityIcons name="paw" size={20} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  
  // paddingBottom is now inline with insets
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  // Info Banner
  infoBanner: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, marginBottom: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  infoIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 20, fontWeight: '500' },
  
  // Image Picker
  imagePicker: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(0, 52, 89, 0.2)', borderStyle: 'dashed' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, opacity: 0.7 },
  
  // Form Inputs
  formGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 8, letterSpacing: -0.3 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '500', color: COLORS.textDark, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  
  // Chips / Pills
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  pillTextActive: { color: COLORS.surface },
  
  // Submit Button
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
});