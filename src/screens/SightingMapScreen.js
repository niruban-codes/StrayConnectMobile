import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
import PixelPaw from '../components/PixelPaw';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Keyboard,
  PermissionsAndroid, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { DEFAULT_SIGHTING_REGION, validCoordinate, placeCoordinate, saveSighting } from '../utils/sighting';

const SEARCH_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const COLORS = { ...ARCADE_COLORS, background: palette.yellow };

export default function SightingMapScreen({ route, navigation, onPick }) {
  const animal = route.params?.animal;
  const picking = Boolean(onPick);
  const insets = useSafeAreaInsets();
  const map = useRef(null);
  const mounted = useRef(true);
  const locationTimer = useRef(null);
  const waitingForLocation = useRef(false);
  const submitLock = useRef(false);
  const pendingSubmission = useRef(null);
  const search = useRef(null);
  const [point, setPoint] = useState(route.params?.point || null);
  const [label, setLabel] = useState(route.params?.point?.locationLabel || '');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [message, setMessage] = useState('');
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [retryPending, setRetryPending] = useState(false);
  const [mapSlow, setMapSlow] = useState(false);
  const locked = submitting || retryPending;

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => setMapSlow(true), 12000);
    return () => { mounted.current = false; clearTimeout(timer); clearTimeout(locationTimer.current); };
  }, []);

  const selectPoint = (coordinate, description = '', center = false) => {
    if (submitLock.current || pendingSubmission.current || !validCoordinate(coordinate)) return;
    waitingForLocation.current = false;
    clearTimeout(locationTimer.current);
    setLocating(false);
    setPoint({ latitude: coordinate.latitude, longitude: coordinate.longitude });
    setLabel(description);
    setMessage('');
    Keyboard.dismiss();
    search.current?.blur();
    if (center) map.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 450);
  };

  const useMyLocation = async () => {
    if (locating || locked) return;
    if (Platform.OS !== 'android') {
      setMessage('Search for a place or tap the map to select your spot.'); return;
    }
    setLocating(true);
    try {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      if (!mounted.current) return;
      const granted = Object.values(grants).includes(PermissionsAndroid.RESULTS.GRANTED);
      if (!granted) {
        setLocating(false);
        setMessage('Location permission was not granted. You can still search or tap the map.'); return;
      }
      waitingForLocation.current = true;
      setLocationAllowed(true);
      setMessage('Finding your position. You can also tap the map.');
      clearTimeout(locationTimer.current);
      locationTimer.current = setTimeout(() => {
        waitingForLocation.current = false;
        setLocating(false);
        setMessage('Location is taking too long. Check that device location is on, or choose the spot manually.');
      }, 15000);
    } catch {
      if (mounted.current) { setLocating(false); setMessage('Unable to use device location. Search or tap the map instead.'); }
    }
  };

  const submit = async () => {
    if (picking) {
      if (validCoordinate(point)) onPick({ ...point, locationLabel: label });
      return;
    }
    if (submitLock.current || !validCoordinate(point) || !animal?.id) return;
    submitLock.current = true;
    setSubmitting(true);
    setMessage('');
    Keyboard.dismiss();
    try {
      if (!auth.currentUser) throw new Error('Please sign in again to report a sighting.');
      if (!pendingSubmission.current) {
        const sightingRef = doc(collection(db, 'animals', animal.id, 'sightings'));
        pendingSubmission.current = { sightingRef,
          notificationRef: doc(collection(db, 'notifications')),
          payload: { ...point, locationLabel: label, notes } };
      }
      const { sightingRef, notificationRef, payload } = pendingSubmission.current;
      const notified = await runTransaction(db, tx => saveSighting(tx, doc(db, 'animals', animal.id),
        sightingRef, notificationRef, payload, auth.currentUser, serverTimestamp()));
      if (!mounted.current) return;
      Alert.alert('Sighting shared', notified
        ? 'A notification with this location has been saved in the pet owner’s Notifications inbox.'
        : 'Your sighting was saved, but this pet has no linked owner account to notify.',
        [{ text: 'Done', onPress: () => navigation.goBack() }], { cancelable: false });
      // Remain locked until leaving to avoid a second submission after success.
    } catch (error) {
      if (!mounted.current) return;
      submitLock.current = false;
      setSubmitting(false);
      setRetryPending(Boolean(pendingSubmission.current));
      setMessage(`${error.message || 'Could not confirm the save.'} Retry safely using the same location.`);
    }
  };

  if (!picking && !animal?.id) return (
    <View style={[styles.empty, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Pet unavailable</Text>
      <Text>Open the pet’s passport again to report a sighting.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.submit}><Text style={styles.submitText}>Go back</Text></TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.title}>{picking ? 'Mark SOS location' : 'Mark a sighting'}</Text><Text style={styles.subtitle}>{picking ? 'Tap the map, then confirm the pin' : `${animal.name || 'Missing pet'} · Help them get home`}</Text></View>
      </View>
      <View style={styles.mapArea}>
        <MapView ref={map} style={StyleSheet.absoluteFillObject} initialRegion={route.params?.point ? { ...route.params.point, latitudeDelta: 0.008, longitudeDelta: 0.008 } : DEFAULT_SIGHTING_REGION}
          onMapReady={() => setReady(true)} showsUserLocation={locationAllowed} showsMyLocationButton={false}
          toolbarEnabled={false} moveOnMarkerPress={false} showsCompass rotateEnabled={false}
          onPress={event => { if (event.nativeEvent.action !== 'marker-press') selectPoint(event.nativeEvent.coordinate); }}
          onLongPress={event => selectPoint(event.nativeEvent.coordinate)}
          onUserLocationChange={event => {
            if (!waitingForLocation.current) return;
            const coordinate = event.nativeEvent.coordinate;
            if (validCoordinate(coordinate)) selectPoint(coordinate, 'Near your current position — adjust the pin if needed', true);
          }}>
          {point && <Marker coordinate={point} draggable={!locked} tracksViewChanges={false}
            pinColor={COLORS.accent} title="Selected location" description="Hold and drag to adjust"
            onDragStart={() => { waitingForLocation.current = false; clearTimeout(locationTimer.current); setLocating(false); }}
            onDragEnd={event => selectPoint(event.nativeEvent.coordinate)}>
            <View style={{ padding: 7, backgroundColor: palette.yellow, borderWidth: 3, borderColor: palette.ink }}><PixelPaw size={24} /></View>
          </Marker>}
        </MapView>
        <View style={styles.searchOverlay} pointerEvents={locked ? 'none' : 'auto'}>
          {SEARCH_KEY ? <GooglePlacesAutocomplete ref={search} placeholder="Search a place in Sri Lanka"
            fetchDetails minLength={3} debounce={350} timeout={8000} keyboardShouldPersistTaps="handled"
            enablePoweredByContainer query={{ key: SEARCH_KEY, language: 'en', components: 'country:lk' }}
            GooglePlacesDetailsQuery={{ fields: 'geometry,formatted_address,name' }}
            onPress={(data, details) => {
              const coordinate = placeCoordinate(details);
              if (coordinate) selectPoint(coordinate, details.formatted_address || data.description || '', true);
              else setMessage('That place has no usable position. Tap the map to mark the spot.');
            }}
            onFail={() => setMessage('Place search is unavailable. You can still tap the map to place a pin.')}
            onTimeout={() => setMessage('Search timed out. Try again or choose the spot on the map.')}
            onNotFound={() => setMessage('No location details found. Try a nearby landmark or tap the map.')}
            textInputProps={{ editable: !locked, accessibilityLabel: picking ? 'Search for SOS location' : 'Search for sighting location', returnKeyType: 'search' }}
            styles={{ container: { flex: 0 }, textInput: styles.searchInput,
              listView: styles.results, description: { color: COLORS.primary } }}
          /> : <Text style={styles.hint}>Tap the map to choose the location.</Text>}
        </View>
        {!ready && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={COLORS.primary} />
          <Text style={styles.subtitle}>{mapSlow ? 'Map is taking longer than expected. Check your connection.' : 'Loading map…'}</Text></View>}
        <TouchableOpacity accessibilityLabel="Use my current location" disabled={locked || locating || !ready}
          style={styles.locate} onPress={useMyLocation}>
          {locating ? <ActivityIndicator color={COLORS.primary} /> : <MaterialCommunityIcons name="crosshairs-gps" size={25} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.sectionTitle}>{point ? 'Confirm the spot' : 'Where is the animal?'}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{point
          ? label || 'Pin selected. Hold and drag it to refine the location.'
          : 'Search, tap the map, or use your location. Nothing is shared until you confirm.'}</Text>
        {point && <Text style={styles.coordinates}>{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</Text>}
        {!picking && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showNotes }}
          disabled={locked} style={styles.notesToggle} onPress={() => setShowNotes(value => !value)}>
          <MaterialCommunityIcons name="note-text-outline" size={18} color={COLORS.primary} />
          <Text style={styles.notesLabel}>{showNotes ? 'Sighting details (optional)' : notes ? 'Edit sighting details' : 'Add sighting details (optional)'}</Text>
          <MaterialCommunityIcons name={showNotes ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
        </TouchableOpacity>}
        {showNotes && <View style={styles.notesPanel}>
          <Text style={styles.subtitle}>Tell the owner what you saw, or describe a nearby landmark.</Text>
          <TextInput style={styles.notes} placeholder="For example: beside the school gate, wearing a red collar" value={notes}
            multiline textAlignVertical="top" onChangeText={setNotes} maxLength={280} editable={!locked}
            accessibilityLabel="Optional note for the pet owner" />
          <Text style={styles.notesCount}>{notes.length}/280</Text>
        </View>}
        {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
        <TouchableOpacity accessibilityRole="button" style={[styles.submit, (!point || submitting) && styles.disabled]}
          disabled={!point || submitting} onPress={submit}>
          {submitting ? <ActivityIndicator color="#fff" /> : <MaterialCommunityIcons name="map-marker-check" color="#fff" size={22} />}
          <Text style={styles.submitText}>{picking ? 'Use this SOS location' : submitting ? 'Sharing sighting…' : retryPending ? 'Retry this sighting' : 'Share sighting location'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.yellow },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14 },
  iconButton: { padding: 10, borderRadius: 0, backgroundColor: palette.paper, borderWidth: 3, borderColor: palette.ink },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 19, color: COLORS.primary },
  subtitle: { fontSize: 13, lineHeight: 19, color: COLORS.muted },
  mapArea: { flex: 1, minHeight: 160 },
  searchOverlay: { position: 'absolute', top: 14, left: 16, right: 16, zIndex: 10 },
  searchInput: { height: 48, borderRadius: 0, color: COLORS.primary, backgroundColor: '#fff', fontSize: 14, borderWidth: 3, borderColor: palette.ink },
  results: { backgroundColor: '#fff', borderRadius: 0, maxHeight: 220, borderWidth: 3, borderColor: palette.ink },
  hint: { padding: 12, backgroundColor: '#fff', borderRadius: 0, color: COLORS.primary, borderWidth: 3, borderColor: palette.ink },
  loading: { position: 'absolute', top: 80, alignSelf: 'center', padding: 12, borderRadius: 0, backgroundColor: palette.paper, maxWidth: '85%', gap: 6, borderWidth: 3, borderColor: palette.ink },
  locate: { position: 'absolute', right: 16, bottom: 20, borderRadius: 0, padding: 14, backgroundColor: '#fff', borderWidth: 3, borderColor: palette.ink },
  footer: { backgroundColor: '#fff', padding: 16, gap: 6 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.primary },
  coordinates: { color: COLORS.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  notesLabel: { flex: 1, color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  notesPanel: { padding: 10, borderRadius: 0, backgroundColor: '#F2F5F7', borderWidth: 3, borderColor: palette.ink },
  notesCount: { textAlign: 'right', color: COLORS.muted, fontSize: 11 },
  notes: { minHeight: 66, maxHeight: 100, borderWidth: 3, borderColor: palette.ink, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.primary, marginVertical: 4 },
  message: { color: '#9A4324', fontSize: 12, lineHeight: 17 },
  submit: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', borderRadius: 0, backgroundColor: COLORS.primary, padding: 16, borderWidth: 3, borderColor: palette.ink },
  submitText: { color: '#fff', fontFamily: "Silkscreen_700Bold", fontSize: 14, letterSpacing: 0 },
  disabled: { opacity: 0.5 },
  empty: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: palette.yellow },
});
