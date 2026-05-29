// src/screens/SightingMapScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar, Animated, Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE 
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  pinkRed: '#FF564F',       // Action/Error
  blueSea: '#00A7E7',
};

// ⚠️ IMPORTANT: You will need a Google Maps API Key for the search to work in production.
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY; 

export default function SightingMapScreen({ route, navigation }) {
  const insets = useSafeAreaInsets(); 
  const { animal } = route.params; 
  const mapRef = useRef(null); 
  
  const [selectedLocation, setSelectedLocation] = useState(null);
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

  // Default to Colombo center
  const initialRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

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
      if (animal.ownerId) {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: animal.ownerId, 
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
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 CUSTOM TOPOGRAPHIC BACKGROUND */}
      <Image 
        source={require('../../assets/images/app-bg.png')} 
        style={styles.bgPattern} 
      />

      {/* 🌟 FIXED HEADER USING INSETS */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Sighting</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 🚀 ANIMATED WRAPPER */}
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* INFO BANNER */}
        <View style={styles.bannerWrapper}>
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconBg}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.pinkRed} />
            </View>
            <Text style={styles.bannerText}>
              Search or tap the map to drop a pin where you saw <Text style={{fontFamily: 'Urbanist_800ExtraBold', color: COLORS.primary}}>{animal.name || 'this pet'}</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {/* SEARCH BAR OVERLAY */}
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
                  mapRef.current?.animateToRegion({
                    ...newLoc,
                    latitudeDelta: 0.01, 
                    longitudeDelta: 0.01,
                  }, 1000);
                }
              }}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en',
                components: 'country:lk', 
              }}
              styles={{
                container: { flex: 0 },
                textInputContainer: { 
                  backgroundColor: COLORS.surface, 
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 4,
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                },
                textInput: { 
                  height: 48, 
                  borderRadius: 12, 
                  paddingHorizontal: 16, 
                  fontFamily: 'Urbanist_600SemiBold', // 🚀 FONT UPDATE 
                  fontSize: 15, 
                  color: COLORS.textDark 
                },
                listView: { backgroundColor: COLORS.surface, borderRadius: 16, marginTop: 8, elevation: 4, borderWidth: 1, borderColor: COLORS.border },
                description: { fontFamily: 'Urbanist_500Medium', color: COLORS.textDark }, // 🚀 FONT UPDATE
              }}
            />
          </View>

          {/* THE MAP */}
          <MapView 
            ref={mapRef}
            style={styles.map} 
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker 
                coordinate={selectedLocation} 
                title={`I saw ${animal.name || 'them'} here`}
                pinColor={COLORS.pinkRed}
              />
            )}
          </MapView>
        </View>

        {/* 🌟 FLOATING FOOTER ADJUSTED FOR BOTTOM INSETS */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
          <TouchableOpacity 
            style={[styles.submitBtn, (!selectedLocation || submitting) && { opacity: 0.6 }]}
            onPress={submitSighting}
            disabled={!selectedLocation || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Text style={styles.submitText}>Confirm Location</Text>
                <MaterialCommunityIcons name="map-marker-check" size={20} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  
  // 🚀 Background Pattern
  bgPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
    resizeMode: 'cover',
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, zIndex: 10 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontFamily: 'Poppins_900Black', fontSize: 18, color: COLORS.primary, letterSpacing: -0.5 },
  
  // Floating Info Banner
  bannerWrapper: { paddingHorizontal: 20, marginBottom: 16, zIndex: 5 },
  bannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  bannerIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, fontFamily: 'Urbanist_600SemiBold', fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  
  // Map Elements
  mapContainer: { flex: 1, position: 'relative', overflow: 'hidden', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  map: { flex: 1 },
  
  searchContainer: { 
    position: 'absolute', 
    top: 20, 
    left: 20, 
    right: 20, 
    zIndex: 999 
  },
  
  // Floating Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 10 },
  
  submitBtn: { backgroundColor: COLORS.pinkRed, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 16, gap: 8, shadowColor: COLORS.pinkRed, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  submitText: { fontFamily: 'Urbanist_800ExtraBold', color: COLORS.surface, fontSize: 16, letterSpacing: -0.3 }
});