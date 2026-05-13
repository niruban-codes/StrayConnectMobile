// src/screens/ProposeEventScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const COLORS = {
  primary: '#154212', background: '#faf9f6', surface: '#ffffff',
  text: '#1a1c1a', outline: '#c2c9bb', error: '#ba1a1a', blue: '#2563eb'
};

export default function ProposeEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Awareness Program');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

      // 🚀 BUG FIX: Safely try to parse the date. If they typed a weird string, 
      // fallback to the current date to prevent Firebase from crashing!
      const parsedDate = new Date(date);
      const safeFirebaseDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      // 2. Save Application to Firestore as PENDING
      await addDoc(collection(db, 'events'), {
        title,
        type,
        description,
        location,
        dateString: date, // We keep exactly what the user typed to show on the screen
        date: safeFirebaseDate, // We save a safe Javascript date for Firebase sorting
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
      // 🚀 NEW: This will print the exact error in your terminal!
      console.error("EVENT SUBMISSION ERROR: ", error); 
      Alert.alert('Error', 'Failed to submit event application: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Host an Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.blue} />
          <Text style={styles.infoText}>All events are reviewed by admins before being published to the community to ensure safety and relevance.</Text>
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="image-plus" size={40} color={COLORS.outline} />
              <Text style={styles.placeholderText}>Upload Event Poster (Optional)</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Event Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Beach Rescue Drive" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Event Type</Text>
        <View style={styles.typeRow}>
          {['Vaccination', 'Rescue', 'Awareness', 'Fundraiser'].map(t => (
            <TouchableOpacity 
              key={t} 
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && {color: '#fff'}]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date & Time *</Text>
        <TextInput style={styles.input} placeholder="e.g. October 20th at 10:00 AM" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Location *</Text>
        <TextInput style={styles.input} placeholder="e.g. Mount Lavinia Beach" value={location} onChangeText={setLocation} />

        <Text style={styles.label}>Description *</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Tell people what the event is about and what they should bring..." 
          multiline numberOfLines={4} 
          value={description} onChangeText={setDescription} 
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Application</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.background },
  backBtn: { padding: 8, backgroundColor: '#f4f3f1', borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  content: { padding: 20, paddingBottom: 60 },
  infoBox: { flexDirection: 'row', backgroundColor: '#e0e7ff', padding: 16, borderRadius: 16, gap: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 13, color: '#3730a3', lineHeight: 20 },
  imagePicker: { width: '100%', height: 180, backgroundColor: '#f4f3f1', borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.outline },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { color: COLORS.outline, fontWeight: '600', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(194,201,187,0.4)', borderRadius: 14, padding: 14, fontSize: 15 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f4f3f1', borderWidth: 1, borderColor: 'transparent' },
  typeChipActive: { backgroundColor: COLORS.primary },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 999, alignItems: 'center', marginTop: 32, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});