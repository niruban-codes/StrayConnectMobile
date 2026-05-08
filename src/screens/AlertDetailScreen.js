// src/screens/AlertDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Image, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  error: '#ba1a1a',
  blue: '#2563eb',
};

export default function AlertDetailScreen({ route, navigation }) {
  const { alertItem: initialAlert } = route.params;
  
  const [alertItem, setAlertItem] = useState(initialAlert);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
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
          <MaterialCommunityIcons name="account-clock" size={20} color={COLORS.outlineVariant} />
          <Text style={[styles.btnText, { color: COLORS.outlineVariant }]}>Someone is already on the way</Text>
        </View>
      );
    }

    // 🚀 UPDATED: Distinct styling for "Under Review" state
    if (alertItem.status === 'reviewing') {
      return (
        <View style={[styles.btn, styles.reviewingBtn]}>
          <MaterialCommunityIcons name="shield-search" size={20} color="#3730a3" />
          <Text style={[styles.btnText, { color: '#3730a3' }]}>Proof Under Admin Review</Text>
        </View>
      );
    }

    if (alertItem.status === 'resolved') {
      return (
        <View style={[styles.btn, styles.resolvedBtn]}>
          <MaterialCommunityIcons name="check-decagram" size={20} color="#154212" />
          <Text style={[styles.btnText, { color: '#154212' }]}>Rescue Verified & Resolved</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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
          
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
            <View>
              <Text style={styles.infoLabel}>Last Known Location</Text>
              <Text style={styles.infoValue}>{alertItem.location}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{alertItem.description}</Text>

        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.bottomBar}>
        {renderBottomAction()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e9e8e5' },
  backBtn: { padding: 8, backgroundColor: '#f4f3f1', borderRadius: 999 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  sliderContainer: { position: 'relative', width: width, height: width },
  sliderImage: { width: width, height: width, resizeMode: 'cover' },
  sliderBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sliderBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { padding: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeText: { fontSize: 13, fontWeight: '500', color: COLORS.outlineVariant },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1c1a', marginBottom: 20, letterSpacing: -0.5 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f4f3f1', padding: 16, borderRadius: 16, marginBottom: 24 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.outlineVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1a1c1a' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1c1a', marginBottom: 8 },
  description: { fontSize: 15, color: '#42493e', lineHeight: 24 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(250,249,246,0.95)', borderTopWidth: 1, borderTopColor: '#e9e8e5' },
  
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 999, gap: 8, elevation: 5 },
  btnText: { fontSize: 15, fontWeight: '800' },
  dangerBtn: { backgroundColor: COLORS.error, shadowColor: COLORS.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  primaryBtn: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  disabledBtn: { backgroundColor: '#e9e8e5', elevation: 0 },
  reviewingBtn: { backgroundColor: '#e0e7ff', elevation: 0 }, // 🚀 distinct indigo color
  resolvedBtn: { backgroundColor: '#bcf0ae', elevation: 0 },
});