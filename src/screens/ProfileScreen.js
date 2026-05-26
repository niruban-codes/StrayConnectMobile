// src/screens/ProfileScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  StatusBar, Alert, Image, ActivityIndicator, Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 IMPORT INSETS
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, where, doc, updateDoc, or } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE (Yellow Background Theme)
const COLORS = {
  primary: '#003459',       // Dark Blue
  background: '#F7DBA7',    // Mon Yellow - MAIN BACKGROUND
  surface: '#FFFFFF',       // Pure White
  border: 'rgba(0, 52, 89, 0.1)', 
  textDark: '#00171F',      
  textMuted: '#52616B',     
  
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

const HEADER_HEIGHT = 60; // Fixed height for our animated header

// 🚀 UPDATED: Mapped to Monito State Colors
const statusStyle = (status) => {
  switch (status) {
    case 'resolved':    return { bg: '#E8F5E9', text: COLORS.greenLight, label: 'Resolved' };
    case 'reviewing':   return { bg: '#E1F5FE', text: COLORS.blueSea, label: 'Under Review' };
    case 'in_progress': return { bg: '#FFF3E0', text: COLORS.orangeShine, label: 'In Progress' };
    default:            return { bg: '#FFEBEE', text: COLORS.pinkRed, label: 'Pending' };
  }
};

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // 🚀 GRAB INSETS

  const [reports, setReports] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);
  
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  
  const user = auth.currentUser;
  const isVerified = user?.emailVerified;

  // 🚀 ENTRANCE ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // 🚀 SCROLLING HEADER ANIMATION VALUES
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // This clamp prevents iOS "bounce" from glitching the header
  const clampedScrollY = Animated.diffClamp(
    scrollY.interpolate({
      inputRange: [0, 10000],
      outputRange: [0, 10000],
      extrapolateLeft: 'clamp',
    }),
    0,
    HEADER_HEIGHT
  );

  // Translates the header from 0 (visible) to -60 (hidden)
  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT], // Slides up completely
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Entrance Animation
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
    });

    const animalsQuery = query(collection(db, 'animals'));
    const unsubAnimals = onSnapshot(animalsQuery, (snap) => {
      setAnimalCount(snap.size);
    });

    const petsQuery = query(collection(db, 'animals'), where('ownerId', '==', user.uid));
    const unsubPets = onSnapshot(petsQuery, (snap) => {
      setUserPets(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoadingPets(false);
    });

    return () => { unsubReports(); unsubAnimals(); unsubPets(); };
  }, [user]);

  const handleReportMissing = (pet) => {
    Alert.alert(
      "Report Missing Pet",
      `Are you sure you want to mark ${pet.name} as missing? This will immediately alert the community and push their profile to the public SOS feed.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Send SOS", 
          style: "destructive", 
          onPress: async () => {
            try {
              const petRef = doc(db, 'animals', pet.id);
              await updateDoc(petRef, { 
                status: 'lost',
                reportedLostAt: new Date() 
              });
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
              await updateDoc(petRef, { 
                status: 'owned',
                reportedLostAt: null 
              });
              Alert.alert("Welcome Home 🎉", `${pet.name} has been removed from the missing list.`);
            } catch (error) {
              Alert.alert("Error", "Failed to update status.");
            }
          } 
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await signOut(auth) },
    ]);
  };

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(user);
      Alert.alert('Sent!', 'A new verification link has been sent to your email.');
    } catch (error) {
      Alert.alert('Wait a moment', 'Please wait a bit before requesting another email.');
    }
  };

  return (
    // 🚀 USE STANDARD VIEW (SafeAreaView removed!)
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 🚀 LAYER 1: SOLID BACKGROUND FOR STATUS BAR */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: insets.top,
        backgroundColor: COLORS.background,
        zIndex: 101 // HIGHEST Z-INDEX
      }} />

      {/* 🚀 LAYER 2: ANIMATED HEADER (Slides behind Layer 1) */}
      <Animated.View style={[
        styles.header, 
        { 
          top: insets.top, // Starts exactly below Layer 1
          height: HEADER_HEIGHT, 
          transform: [{ translateY: headerTranslateY }] 
        }
      ]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="paw" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + insets.top + 20 } // 🚀 Push scroll content down
        ]} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* 🚀 ANIMATED WRAPPER */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* 🌟 PROFILE SECTION */}
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

            {!isVerified && (
              <TouchableOpacity onPress={handleResendVerification} style={styles.unverifiedBadge}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.pinkRed} />
                <Text style={styles.unverifiedText}>Email Unverified - Tap to Resend</Text>
              </TouchableOpacity>
            )}

            {/* 🌟 STATS ROW */}
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

          {/* 🌟 DIGITAL PASSPORTS */}
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

                  {pet.status === 'lost' ? (
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

          {/* 🌟 MY REPORTS */}
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

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <MaterialCommunityIcons name="logout" size={18} color={COLORS.pinkRed} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  
  // 🌟 Absolute Header for Collapsing Effect
  header: { 
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.background, 
    zIndex: 100 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  headerBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  
  scroll: { flex: 1 },
  // inline padding applied in the component!
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Profile Section
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  avatarText: { fontSize: 40, fontWeight: '900', color: COLORS.surface },
  verifiedDot: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.background, borderRadius: 999, padding: 2 },
  
  userName: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 4 },
  userEmail: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 16 },
  
  unverifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20 },
  unverifiedText: { fontSize: 12, fontWeight: '800', color: COLORS.pinkRed },
  
  // Stats Row
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, width: '100%', borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  statNumber: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  
  // Section Headers
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 4 },
  addBtnText: { color: COLORS.surface, fontSize: 13, fontWeight: '800' },
  
  // Empty States
  emptyState: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  
  // Passport Cards
  passportCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  passportHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  passportImageContainer: { width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.background, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  passportImage: { width: '100%', height: '100%' },
  passportInfo: { flex: 1 },
  petName: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 2, letterSpacing: -0.3 },
  petDetails: { fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize', marginBottom: 8, fontWeight: '600' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, alignSelf: 'flex-start' },
  trustText: { fontSize: 10, fontWeight: '800' },
  
  actionHub: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: COLORS.background, borderRadius: 12, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  
  // Report Cards
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  reportIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4, textTransform: 'capitalize', letterSpacing: -0.3 },
  reportMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  // Sign Out
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 16, marginTop: 32, borderWidth: 1, borderColor: '#FFEBEE' },
  signOutText: { fontSize: 15, fontWeight: '800', color: COLORS.pinkRed },
});