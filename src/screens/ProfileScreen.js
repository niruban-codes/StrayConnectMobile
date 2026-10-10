import { COLORS as ARCADE_COLORS, palette } from '../design/theme';
import { useFeedStatus } from '../hooks/useFeedStatus';
import FeedError from '../components/FeedError';
// src/screens/ProfileScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Image, ActivityIndicator, Animated, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, where, doc, runTransaction, or } from 'firebase/firestore';

import { useVerifiedEmail } from '../hooks/useVerifiedEmail';
import { setPetMissing } from '../utils/missingPet';

const COLORS = { ...ARCADE_COLORS, background: palette.purple };

const HEADER_HEIGHT = 60;

const statusStyle = (status) => {
  switch (status) {
    case 'resolved':    return { bg: '#E8F5E9', text: COLORS.greenLight, label: 'Resolved' };
    case 'reviewing':   return { bg: '#E1F5FE', text: COLORS.blueSea, label: 'Under Review' };
    case 'in_progress': return { bg: '#FFF3E0', text: COLORS.orangeShine, label: 'In Progress' };
    default:            return { bg: '#FFEBEE', text: COLORS.pinkRed, label: 'Pending' };
  }
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { error: feedError, fail: failFeed, retry, retryKey } = useFeedStatus();

  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);

  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const user = auth.currentUser;
  const [isVerified, refreshVerification] = useVerifiedEmail();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    if (!user) return;

    const reportsQuery = query(
      collection(db, 'reports'),
      or(
        where('createdBy', '==', user.uid),
        where('helperId', '==', user.uid)
      )
    );

    const unsubReports = onSnapshot(reportsQuery, (snap) => {
      const fetchedReports = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      fetchedReports.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setReports(fetchedReports);
    }, failFeed);

    const animalsQuery = query(collection(db, 'animals'));
    const unsubAnimals = onSnapshot(animalsQuery, (snap) => {
      setAnimalCount(snap.size);
    }, failFeed);

    const petsQuery = query(collection(db, 'animals'), where('ownerId', '==', user.uid));
    const unsubPets = onSnapshot(petsQuery, (snap) => {
      setUserPets(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoadingPets(false);
    }, error => { setLoadingPets(false); failFeed(error); });

    const unsubApplications = onSnapshot(query(collection(db, 'adoptionRequests'), where('userId', '==', user.uid)), snapshot => {
      const items = snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setApplications(items);
    }, failFeed);
    return () => { unsubReports(); unsubAnimals(); unsubPets(); unsubApplications(); };
  }, [user, retryKey, failFeed]);

  const handleReportMissing = (pet) => {
    Alert.alert(
      "Report Missing Pet",
      `Are you sure you want to mark ${pet.name} as missing? Their profile will appear in the public SOS feed so people can report sightings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Send SOS",
          style: "destructive",
          onPress: async () => {
            try {
              const petRef = doc(db, 'animals', pet.id);
              await runTransaction(db, tx => setPetMissing(tx, petRef, auth.currentUser?.uid, true, new Date()));
              Alert.alert("SOS Sent 🚨", `${pet.name} is now on the community missing feed.`);
            } catch (error) {
              Alert.alert("Error", "Failed to send SOS. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleMarkFound = (pet) => {
    Alert.alert(
      "Cancel SOS",
      `Have you safely located ${pet.name}?`,
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, they are safe!",
          style: "default",
          onPress: async () => {
            try {
              const petRef = doc(db, 'animals', pet.id);
              await runTransaction(db, tx => setPetMissing(tx, petRef, auth.currentUser?.uid, false, new Date()));
              Alert.alert("Welcome Home 🎉", `${pet.name} has been removed from the missing list.`);
            } catch (error) {
              Alert.alert("Error", "Failed to update status.");
            }
          }
        }
      ]
    );
  };

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(user);
      Alert.alert('Sent!', 'A new verification link has been sent to your email.');
    } catch (error) {
      Alert.alert('Wait a moment', 'Please wait a bit before requesting another email.');
    }
  };

  if (feedError) return <FeedError message={feedError} onRetry={retry} />;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />



      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: insets.top,
        backgroundColor: COLORS.background,
        zIndex: 101
      }} />

      <Animated.View style={[
        styles.header,
        {
          top: insets.top,
          height: HEADER_HEIGHT,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/sc-logo.png')}
            style={styles.headerLogoIcon}
          />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <Text style={styles.impactTitle}>YOUR CARE COUNTS.</Text>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              {isVerified && (
                <View style={styles.verifiedDot}>
                  <MaterialCommunityIcons name="check-decagram" size={24} color={COLORS.blueSea} />
                </View>
              )}
            </View>

            <Text style={styles.userName}>{user?.displayName || 'Community Member'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>

            {!isVerified && <TouchableOpacity style={styles.unverifiedBadge} onPress={async () => {
              try { Alert.alert('Email verification', await refreshVerification() ? 'Your email is verified. You can now report and apply to adopt.' : 'Your email is still unverified. Open the link in your email, then try again.'); }
              catch { Alert.alert('Unable to check', 'Check your connection and try again.'); }
            }}><Text style={styles.unverifiedText}>I have verified my email — check again</Text></TouchableOpacity>}
            {!isVerified && (
              <TouchableOpacity onPress={handleResendVerification} style={styles.unverifiedBadge}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.pinkRed} />
                <Text style={styles.unverifiedText}>Email Unverified - Tap to Resend</Text>
              </TouchableOpacity>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{reports.length}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userPets.length}</Text>
                <Text style={styles.statLabel}>My Pets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{animalCount}</Text>
                <Text style={styles.statLabel}>Global DB</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Digital Passports</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RegisterPet')}>
              <MaterialCommunityIcons name="plus" size={16} color={COLORS.surface} />
              <Text style={styles.addBtnText}>Add Pet</Text>
            </TouchableOpacity>
          </View>

          {loadingPets ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : userPets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="badge-account-horizontal-outline" size={40} color={COLORS.textMuted} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>No Pets Registered</Text>
              <Text style={styles.emptySub}>Add your pet to create their official digital health passport.</Text>
            </View>
          ) : (
            userPets.map((pet) => (
              <View key={pet.id} style={styles.passportCard}>
                <View style={styles.passportHeader}>
                  <View style={styles.passportImageContainer}>
                    {pet.imageUrl ? (
                      <Image source={{ uri: pet.imageUrl }} style={styles.passportImage} />
                    ) : (
                      <MaterialCommunityIcons name="paw" size={28} color={COLORS.textMuted} />
                    )}
                  </View>
                  <View style={styles.passportInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDetails}>
                      {pet.species} • {pet.breed} • {pet.age ? `${pet.age} yrs` : 'Age unknown'}
                    </Text>

                    {pet.isVerified ? (
                      <View style={[styles.trustBadge, { backgroundColor: '#E1F5FE' }]}>
                        <MaterialCommunityIcons name="shield-check" size={12} color={COLORS.blueSea} />
                        <Text style={[styles.trustText, { color: COLORS.blueSea }]}>Vet Verified: {pet.animalId}</Text>
                      </View>
                    ) : (
                      <View style={[styles.trustBadge, { backgroundColor: '#FFF3E0' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.orangeShine} />
                        <Text style={[styles.trustText, { color: COLORS.orangeShine }]}>Pending Verification</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionHub}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Browse', { screen: 'AnimalDetail', params: { animal: pet } })}
                  >
                    <MaterialCommunityIcons name="medical-bag" size={18} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Medical</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Browse', { screen: 'AnimalDetail', params: { animal: pet } })}
                  >
                    <MaterialCommunityIcons name="needle" size={18} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Vaccines</Text>
                  </TouchableOpacity>

                  {pet.status === 'archived' ? (<Text style={styles.actionBtnText}>Archived</Text>) : pet.status === 'lost' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
                      onPress={() => handleMarkFound(pet)}
                    >
                      <MaterialCommunityIcons name="home-heart" size={18} color={COLORS.greenLight} />
                      <Text style={[styles.actionBtnText, { color: COLORS.greenLight }]}>Found</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
                      onPress={() => handleReportMissing(pet)}
                    >
                      <MaterialCommunityIcons name="alert-octagon" size={18} color={COLORS.pinkRed} />
                      <Text style={[styles.actionBtnText, { color: COLORS.pinkRed }]}>SOS</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My adoption applications</Text>
          {!applications.length && <Text>No adoption applications yet.</Text>}
          {applications.map(application => <View key={application.id} style={{ padding: 16, backgroundColor: palette.paper, borderWidth: 3, borderColor: palette.ink, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700', color: COLORS.primary }}>{application.animalName || 'Pet adoption'}</Text>
            <Text style={{ textTransform: 'capitalize', marginTop: 4 }}>{application.status}</Text>
            {!!application.closeReason && <Text>{application.closeReason}</Text>}
          </View>)}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Reports & Tasks</Text>
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={COLORS.textMuted} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>No active reports</Text>
              <Text style={styles.emptySub}>Reports you submit or claim will appear here</Text>
            </View>
          ) : (
            reports.map((report) => {
              const sc = statusStyle(report.status);
              const isHelper = report.helperId === user.uid;

              return (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('SOS Feed', { screen: 'AlertDetail', params: { alertItem: report } })}
                >
                  <View style={[styles.reportIconBox, { backgroundColor: sc.bg }]}>
                    <MaterialCommunityIcons
                      name={isHelper ? 'run-fast' : 'alert-rhombus'}
                      size={22}
                      color={sc.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>
                      {isHelper ? `Assigned: ${report.incidentType}` : `${report.incidentType} Report`}
                    </Text>
                    <Text style={styles.reportMeta} numberOfLines={1}>{report.location}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  impactTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 23, marginBottom: 24, color: palette.ink },
  safe: { flex: 1, backgroundColor: COLORS.background },


  header: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: COLORS.background, zIndex: 100, borderBottomWidth: 3, borderBottomColor: palette.ink },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  headerLogoIcon: { width: 28, height: 28, resizeMode: 'contain', borderRadius: 0 },

  headerTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0 },
  headerBtn: { padding: 8, backgroundColor: palette.paper, borderRadius: 0, borderWidth: 3, borderColor: palette.ink },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 0, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  avatarText: { fontFamily: "Silkscreen_700Bold", fontSize: 32, color: COLORS.surface, letterSpacing: 0 },
  verifiedDot: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.background, borderRadius: 0, padding: 2 },

  userName: { fontFamily: "Silkscreen_700Bold", fontSize: 21, color: COLORS.primary, letterSpacing: 0, marginBottom: 4 },
  userEmail: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },

  unverifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 0, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20, borderWidth: 3, borderColor: palette.ink },
  unverifiedText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.pinkRed },

  statsRow: { flexDirection: 'row', backgroundColor: palette.ink, borderRadius: 0, padding: 16, marginTop: 20, width: '100%', borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statNumber: { fontFamily: "Silkscreen_700Bold", fontSize: 19, color: palette.yellow, letterSpacing: 0 },
  statLabel: { fontFamily: "Poppins_700Bold", fontSize: 12, color: palette.mint, marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, letterSpacing: 0, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 0, gap: 4, borderWidth: 3, borderColor: palette.ink },
  addBtnText: { fontFamily: "Poppins_700Bold", color: COLORS.surface, fontSize: 13 },

  emptyState: { alignItems: 'center', backgroundColor: palette.paper, padding: 32, borderRadius: 0, borderWidth: 3, borderColor: palette.ink, marginBottom: 24 },
  emptyTitle: { fontFamily: "Silkscreen_700Bold", fontSize: 16, color: COLORS.primary, marginTop: 12, marginBottom: 6, letterSpacing: 0 },
  emptySub: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  passportCard: { backgroundColor: COLORS.surface, borderRadius: 0, padding: 16, marginBottom: 20, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  passportHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  // 🚀 FIXED: Swapped from COLORS.background to COLORS.inputFill for the photo box
  passportImageContainer: { width: 64, height: 64, borderRadius: 0, backgroundColor: COLORS.inputFill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  passportImage: { width: '100%', height: '100%' },
  passportInfo: { flex: 1 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.primary, marginBottom: 2, letterSpacing: -0.3 },
  petDetails: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize', marginBottom: 8 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 0, gap: 4, alignSelf: 'flex-start' },
  trustText: { fontFamily: "Poppins_700Bold", fontSize: 10 },

  actionHub: { flexDirection: 'row', gap: 8, borderTopWidth: 3, borderTopColor: palette.ink, paddingTop: 16 },
  // 🚀 FIXED: Swapped from COLORS.background to COLORS.inputFill for the buttons
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: COLORS.inputFill, borderRadius: 0, gap: 6, borderWidth: 3, borderColor: palette.ink },
  actionBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: COLORS.primary },

  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surface, borderRadius: 0, padding: 16, marginBottom: 12, borderWidth: 3, borderColor: palette.ink, boxShadow: "4px 4px 0px 0px #111111" },
  reportIconBox: { width: 48, height: 48, borderRadius: 0, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.primary, marginBottom: 4, textTransform: 'capitalize', letterSpacing: -0.3 },
  reportMeta: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  statusBadge: { borderRadius: 0, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 0.5 },
});
