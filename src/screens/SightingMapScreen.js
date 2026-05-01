// src/screens/SightingMapScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  background: '#faf9f6',
  error: '#ba1a1a',
  surface: '#ffffff',
  onSurface: '#1a1c1a',
  outlineVariant: '#c2c9bb',
};

// ⚠️ IMPORTANT: You will need a Google Maps API Key for the search to work in production.
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY; 

export default function SightingMapScreen({ route, navigation }) {
  const { animal } = route.params; 
  const mapRef = useRef(null); // Reference to control the map camera
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Default to Colombo center
  const initialRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Handle manual map taps
  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  // Submit logic (Unchanged)
  const submitSighting = async () => {
    if (!selectedLocation) {
      Alert.alert("Drop a Pin", "Please tap the map or search for a location to drop a pin.");
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      
      // 1. Save the sighting to the animal's sub-collection
      const sightingsRef = collection(db, 'animals', animal.id, 'sightings');
      const newSighting = await addDoc(sightingsRef, {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        reportedBy: currentUser ? currentUser.uid : 'anonymous',
        reporterEmail: currentUser ? currentUser.email : 'anonymous',
        timestamp: serverTimestamp(),
      });

      // 2. NEW: Send an In-App Notification to the Owner
      // We check if the animal has an ownerId attached to it
      if (animal.ownerId) {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: animal.ownerId, // This makes sure it goes to the exact right person!
          type: 'sighting',
          title: `New Sighting: ${animal.name}!`,
          message: `Someone just dropped a pin where they saw ${animal.name}.`,
          animalId: animal.id,
          sightingId: newSighting.id,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert(
        "Sighting Logged! 📍", 
        `Thank you! The owner has been notified of ${animal.name}'s location.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Could not save sighting: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Sighting</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.banner}>
        <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.error} />
        <Text style={styles.bannerText}>
          Search or tap the map to drop a pin where you saw <Text style={{fontWeight: 'bold'}}>{animal.name}</Text>.
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {/* Search Bar Overlay */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search street, building, or area..."
            fetchDetails={true}
            onPress={(data, details = null) => {
              if (details) {
                const newLoc = {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                };
                setSelectedLocation(newLoc);
                // Animate the map to fly to the searched location
                mapRef.current?.animateToRegion({
                  ...newLoc,
                  latitudeDelta: 0.01, // Zoom in closer
                  longitudeDelta: 0.01,
                }, 1000);
              }
            }}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
              components: 'country:lk', // Restricts results to Sri Lanka!
            }}
            styles={{
              container: { flex: 0 },
              textInputContainer: { 
                backgroundColor: '#fff', 
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              },
              textInput: { height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 15 },
              listView: { backgroundColor: '#fff', borderRadius: 12, marginTop: 8, elevation: 4 },
            }}
          />
        </View>

        {/* The Map */}
        <MapView 
          ref={mapRef}
          style={styles.map} 
          initialRegion={initialRegion}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker 
              coordinate={selectedLocation} 
              title={`I saw ${animal.name} here`}
              pinColor={COLORS.error}
            />
          )}
        </MapView>
      </View>

      {/* Submit Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedLocation || submitting) && { opacity: 0.6 }]}
          onPress={submitSighting}
          disabled={!selectedLocation || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Confirm Location</Text>
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.background, zIndex: 10 },
  backBtn: { padding: 8, backgroundColor: '#f4f3f1', borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffebe9', padding: 16, gap: 10 },
  bannerText: { flex: 1, fontSize: 13, color: COLORS.error, lineHeight: 18 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  searchContainer: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    right: 16, 
    zIndex: 999 
  },
  footer: { padding: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: '#e9e8e5' },
  submitBtn: { backgroundColor: COLORS.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});