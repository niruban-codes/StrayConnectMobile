// src/screens/RegisterPetScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar, Image, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  surface: '#ffffff',
  outlineVariant: '#c2c9bb',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
};

export default function RegisterPetScreen({ navigation }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [contact, setContact] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📸 1. Pick an Image from Camera Roll
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress slightly for faster uploads
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🚀 2. Submit to Cloudinary & Firestore
  const handleRegister = async () => {
    if (!name || !imageUri) {
      Alert.alert('Missing Info', 'Please provide your pet\'s name and a photo.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in.");

      // A. Upload Image to Cloudinary (Using your existing web credentials)
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register My Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={COLORS.primary} />
          <Text style={styles.bannerText}>
            Self-registered pets will be marked as <Text style={{fontWeight: '700'}}>Pending Verification</Text> until examined by a registered Vet.
          </Text>
        </View>

        {/* Photo Upload */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={40} color={COLORS.outlineVariant} />
              <Text style={styles.imagePlaceholderText}>Add Pet Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Pet Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Bella" placeholderTextColor={COLORS.outlineVariant} />
        </View>
        {/* New Contact Field */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Emergency Contact Number</Text>
          <TextInput 
            style={styles.input} 
            value={contact} 
            onChangeText={setContact} 
            placeholder="e.g., 077 123 4567" 
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.outlineVariant} 
          />
        </View>

        {/* NEW EXPANDED SPECIES BLOCK */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Species</Text>
          <View style={[styles.pillRow, { flexWrap: 'wrap' }]}>
            {['Dog', 'Cat', 'Bird', 'Rabbit', 'Reptile', 'Livestock', 'Other'].map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.pill, species === s && styles.pillActive]} 
                onPress={() => setSpecies(s)}
              >
                <Text style={[styles.pillText, species === s && styles.pillTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Breed / Mix (Optional)</Text>
          <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="e.g., Golden Retriever" placeholderTextColor={COLORS.outlineVariant} />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Age (Years)</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="e.g., 2" keyboardType="numeric" placeholderTextColor={COLORS.outlineVariant} />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Sex</Text>
            <View style={styles.pillRow}>
              {['Male', 'Female'].map(s => (
                <TouchableOpacity key={s} style={[styles.pill, sex === s && styles.pillActive]} onPress={() => setSex(s)}>
                  <Text style={[styles.pillText, sex === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="paw" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Registration</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.background },
  backBtn: { padding: 8, backgroundColor: '#f4f3f1', borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  scrollContent: { padding: 20, paddingBottom: 60 },
  infoBanner: { flexDirection: 'row', backgroundColor: '#e8f5e9', padding: 16, borderRadius: 16, marginBottom: 24, alignItems: 'center', gap: 12 },
  bannerText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
  imagePicker: { width: '100%', height: 200, backgroundColor: '#f4f3f1', borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 2, borderColor: '#e9e8e5', borderStyle: 'dashed' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  formGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e9e8e5', borderRadius: 16, padding: 16, fontSize: 15, color: COLORS.onSurface },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f4f3f1', borderWidth: 1, borderColor: '#e9e8e5' },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  pillTextActive: { color: '#ffffff' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});