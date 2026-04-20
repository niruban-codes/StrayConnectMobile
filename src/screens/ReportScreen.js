import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView,
  StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';

const COLORS = {
  primary: '#154212',
  primaryContainer: '#2d5a27',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

const INCIDENT_TYPES = ['Lost', 'Found', 'Abuse'];
const ANIMAL_TYPES = [
  { label: 'Dog', icon: 'dog' },
  { label: 'Cat', icon: 'cat' },
  { label: 'Other', icon: 'paw' },
];

export default function ReportScreen() {
  const [incidentType, setIncidentType] = useState('Found');
  const [animalType, setAnimalType] = useState('Dog');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
    // Hardcode your exact credentials, just like we did on the React Web Dashboard
    const cloudName = "dorhbk11x"; 
    const uploadPreset = "strayconnect_uploads"; 

    const formData = new FormData();
    // In React Native, the file object needs uri, type, and name
    formData.append('file', { uri, type: 'image/jpeg', name: 'report.jpg' });
    formData.append('upload_preset', uploadPreset);
    
    // Fixed the variable name in the URL to use ${cloudName}
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.secure_url;
  };

  const handleSubmit = async () => {
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
        createdBy: 'mobile',
      });

      Alert.alert(
        '✅ Report Submitted',
        'Thank you! Your report has been received and will be reviewed within 2 hours.',
        [{ text: 'OK', onPress: () => {
          setIncidentType('Found'); setAnimalType('Dog');
          setLocation(''); setDescription('');
          setContact(''); setPhotos([]);
        }}]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="paw" size={22} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Report an Animal</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Report an Animal in Need</Text>
        <Text style={styles.pageSubtitle}>Provide details to help us locate and assist the stray.</Text>

        {/* Photo Upload */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Upload Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                <MaterialCommunityIcons name="camera" size={28} color={COLORS.outlineVariant} />
                <Text style={styles.addPhotoText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                <MaterialCommunityIcons name="image-multiple" size={28} color={COLORS.outlineVariant} />
                <Text style={styles.addPhotoText}>Gallery</Text>
              </TouchableOpacity>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removePhoto(i)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                  <View style={[styles.photoThumb, { margin: 0 }]}>
                    <MaterialCommunityIcons name="image" size={32} color={COLORS.outlineVariant} />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          {photos.length > 0 && (
            <Text style={styles.photoCount}>{photos.length} photo{photos.length > 1 ? 's' : ''} selected</Text>
          )}
        </View>

        {/* Incident Type */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Incident Type</Text>
          <View style={styles.toggleRow}>
            {INCIDENT_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.toggleBtn, incidentType === type && styles.toggleBtnActive]}
                onPress={() => setIncidentType(type)}
              >
                <Text style={[styles.toggleText, incidentType === type && styles.toggleTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Animal Type */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Animal Type</Text>
          <View style={styles.animalTypeRow}>
            {ANIMAL_TYPES.map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={[styles.animalTypeBtn, animalType === label && styles.animalTypeBtnActive]}
                onPress={() => setAnimalType(label)}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={22}
                  color={animalType === label ? '#fff' : COLORS.onSurfaceVariant}
                />
                <Text style={[styles.animalTypeText, animalType === label && styles.animalTypeTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Location</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.outlineVariant} />
            <TextInput
              style={styles.input}
              placeholder="Search address or landmark..."
              placeholderTextColor={COLORS.outlineVariant}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Description</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe the animal's appearance, behavior, or any visible injuries..."
            placeholderTextColor={COLORS.outlineVariant}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Contact Number</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>🇱🇰 +94</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="7X XXX XXXX"
              placeholderTextColor={COLORS.outlineVariant}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialCommunityIcons name="fingerprint" size={22} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Digital Identity</Text>
            <Text style={styles.infoText}>
              Your report helps us assign a unique Digital ID, ensuring this stray receives continuous care and tracking.
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Report</Text>
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.submitNote}>Reports are reviewed within 2 hours</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf9f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(250,249,246,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194,201,187,0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#154212',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#42493e',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#f4f3f1',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1c1a',
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  addPhotoBtn: {
    width: 80,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c2c9bb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    color: '#72796e',
    fontWeight: '600',
  },
  photoThumb: {
    width: 80,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#e9e8e5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  photoCount: {
    fontSize: 11,
    color: '#154212',
    fontWeight: '600',
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c2c9bb',
  },
  toggleBtnActive: {
    backgroundColor: '#154212',
    borderColor: '#154212',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42493e',
  },
  toggleTextActive: {
    color: '#fff',
  },
  animalTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  animalTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c2c9bb',
  },
  animalTypeBtnActive: {
    backgroundColor: '#154212',
    borderColor: '#154212',
  },
  animalTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42493e',
  },
  animalTypeTextActive: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1c1a',
  },
  prefix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1c1a',
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#1a1c1a',
    minHeight: 100,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#154212',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#42493e',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#154212',
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  submitNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#72796e',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});