// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
const COLORS = {
  primary: '#154212',
  primaryFixed: '#bcf0ae',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  amber: '#d97706',
  error: '#ba1a1a',
  blue: '#2563eb',
};

const statusStyle = (status) => {
  switch (status) {
    case 'resolved':    return { bg: '#bcf0ae', text: '#002201', label: 'Resolved' };
    case 'reviewing':   return { bg: '#dbe1ff', text: '#003ea8', label: 'Under Review' };
    default:            return { bg: '#fef3c7', text: '#d97706', label: 'Pending' };
  }
};

export default function ProfileScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);
  
  // NEW: State for User's Pets
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  
  const user = auth.currentUser;
  const isVerified = user?.emailVerified;

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Reports
    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubReports = onSnapshot(reportsQuery, (snap) => {
      setReports(snap.docs.slice(0, 5).map(d => ({ ...d.data(), id: d.id })));
    });

    // 2. Fetch Global Animal Count
    const animalsQuery = query(collection(db, 'animals'));
    const unsubAnimals = onSnapshot(animalsQuery, (snap) => {
      setAnimalCount(snap.size);
    });

    // 3. NEW: Fetch ONLY this user's registered pets
    const petsQuery = query(collection(db, 'animals'), where('ownerId', '==', user.uid));
    const unsubPets = onSnapshot(petsQuery, (snap) => {
      setUserPets(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoadingPets(false);
    });

    return () => { unsubReports(); unsubAnimals(); unsubPets(); };
  }, [user]);

  // 🚨 REPORT MISSING LOGIC
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

  // 🏡 MARK FOUND LOGIC
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <MaterialCommunityIcons name="paw" size={22} color={COLORS.primary} />
        <Text style={styles.headerTitle}>StrayConnect</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Section (Kept from your original code!) */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 36, fontWeight: 'bold', color: COLORS.primary }}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            {isVerified && (
              <View style={styles.verifiedDot}>
                <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primary} />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.displayName || 'Community Member'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>

          {isVerified ? (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star-circle" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>Verified Member</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleResendVerification} style={[styles.badge, { backgroundColor: '#ffdad6' }]}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={[styles.badgeText, { color: COLORS.error }]}>Email Unverified - Tap to Resend</Text>
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

        {/* 🚀 NEW: DIGITAL PASSPORTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Digital Passports</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('RegisterPet')}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Pet</Text>
          </TouchableOpacity>
        </View>

        {loadingPets ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : userPets.length === 0 ? (
          <View style={styles.emptyPassportState}>
            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={40} color={COLORS.outlineVariant} />
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
                    <MaterialCommunityIcons name="paw" size={30} color={COLORS.outlineVariant} />
                  )}
                </View>
                <View style={styles.passportInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>
                    {pet.species} • {pet.breed} • {pet.age ? `${pet.age} yrs` : 'Age unknown'}
                  </Text>
                  
                  {/* Trust Pipeline Badge */}
                  {pet.isVerified ? (
                    <View style={[styles.trustBadge, { backgroundColor: '#dbe1ff' }]}>
                      <MaterialCommunityIcons name="shield-check" size={12} color={COLORS.blue} />
                      <Text style={[styles.trustText, { color: COLORS.blue }]}>Vet Verified: {pet.animalId}</Text>
                    </View>
                  ) : (
                    <View style={[styles.trustBadge, { backgroundColor: '#fef3c7' }]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.amber} />
                      <Text style={[styles.trustText, { color: COLORS.amber }]}>Pending Vet Verification</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Hub */}
              <View style={styles.actionHub}>
                <TouchableOpacity style={styles.actionBtn}>
                  <MaterialCommunityIcons name="medical-bag" size={18} color={COLORS.primary} />
                  <Text style={styles.actionBtnText}>Medical</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <MaterialCommunityIcons name="needle" size={18} color={COLORS.primary} />
                  <Text style={styles.actionBtnText}>Vaccines</Text>
                </TouchableOpacity>
                {/* Dynamic Missing / Found Toggle */}
                {pet.status === 'lost' ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#e8f5e9' }]}
                    onPress={() => handleMarkFound(pet)}
                  >
                    <MaterialCommunityIcons name="home-heart" size={18} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Safe & Found</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#ffdad6' }]}
                    onPress={() => handleReportMissing(pet)}
                  >
                    <MaterialCommunityIcons name="alert-octagon" size={18} color={COLORS.error} />
                    <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Missing SOS</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />

        {/* Recent Reports (Kept from your original code!) */}
        <Text style={styles.sectionTitle}>My Reports</Text>
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={36} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>No reports submitted yet</Text>
            <Text style={styles.emptySubtext}>Reports you submit will appear here</Text>
          </View>
        ) : (
          reports.map((report) => {
            const sc = statusStyle(report.status);
            return (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportIconBox}>
                  <MaterialCommunityIcons
                    name={report.incidentType === 'Lost' ? 'map-search-outline' : report.incidentType === 'Abuse' ? 'alert-outline' : 'paw-outline'}
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>{report.incidentType || 'Found'} {report.animalType || 'Animal'}</Text>
                  <Text style={styles.reportMeta}>{report.location || 'Unknown location'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf9f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'rgba(250,249,246,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(194,201,187,0.3)' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#154212', letterSpacing: -0.3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  profileSection: { alignItems: 'center', marginBottom: 28 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 999, backgroundColor: '#bcf0ae', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#1a1c1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  verifiedDot: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 999, padding: 2 },
  userName: { fontSize: 22, fontWeight: '800', color: '#154212', letterSpacing: -0.3, marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#42493e', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#bcf0ae', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#154212' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20, padding: 16, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#c2c9bb', marginVertical: 4 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#154212' },
  statLabel: { fontSize: 11, color: '#42493e', textAlign: 'center', marginTop: 2 },
  
  // NEW PASSPORT STYLES
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#154212', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#154212', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, gap: 4 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyPassportState: { alignItems: 'center', backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e9e8e5', marginBottom: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a1c1a', marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#42493e', textAlign: 'center', lineHeight: 18 },
  passportCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e9e8e5', shadowColor: '#1a1c1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  passportHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  passportImageContainer: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#f4f3f1', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  passportImage: { width: '100%', height: '100%' },
  passportInfo: { flex: 1 },
  petName: { fontSize: 18, fontWeight: '800', color: '#1a1c1a', marginBottom: 2 },
  petDetails: { fontSize: 12, color: '#42493e', textTransform: 'capitalize', marginBottom: 6 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, alignSelf: 'flex-start' },
  trustText: { fontSize: 10, fontWeight: '700' },
  actionHub: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f4f3f1', paddingTop: 12 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#f4f3f1', borderRadius: 10, gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#154212' },

  // REPORTS & OTHER STYLES
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  reportIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#bcf0ae', alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 14, fontWeight: '700', color: '#1a1c1a', marginBottom: 2, textTransform: 'capitalize' },
  reportMeta: { fontSize: 12, color: '#42493e' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#42493e' },
  emptySubtext: { fontSize: 12, color: '#72796e' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffdad6', borderRadius: 999, paddingVertical: 14, marginTop: 30, marginBottom: 12 },
  signOutText: { fontSize: 14, fontWeight: '600', color: '#ba1a1a' },
});