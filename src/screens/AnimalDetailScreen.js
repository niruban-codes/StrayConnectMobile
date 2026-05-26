// src/screens/AnimalDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, StatusBar,
  Linking, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE (Updated to Yellow Theme)
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

const statusStyle = (status) => {
  switch (status) {
    case 'adopted':   return { bg: '#E8F5E9', text: COLORS.greenLight };
    case 'sheltered': return { bg: '#E1F5FE', text: COLORS.blueSea };
    case 'lost':      return { bg: '#FFEBEE', text: COLORS.pinkRed };
    default:          return { bg: '#FFF3E0', text: COLORS.orangeShine };
  }
};

export default function AnimalDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets(); 
  const { animal } = route.params;
  const [activeTab, setActiveTab] = useState('vaccinations');
  
  // Keep local state for status so UI updates immediately if owner changes it
  const [currentStatus, setCurrentStatus] = useState(animal.status);
  const sc = statusStyle(currentStatus);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [livingSituation, setLivingSituation] = useState('Apartment');
  const [experience, setExperience] = useState('First-time owner');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const currentUser = auth.currentUser;
  const isOwner = currentUser && animal.ownerId === currentUser.uid;

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

  const handleContact = () => {
    if (currentStatus === 'lost' && animal.ownerContact) {
      Linking.openURL(`tel:${animal.ownerContact}`);
    } 
    else if (animal.shelter?.contactNumber) {
      Linking.openURL(`tel:${animal.shelter.contactNumber}`);
    } 
    else {
      Alert.alert('No contact', 'No contact number available for this animal.');
    }
  };

  const handleAdoptPress = () => {
    if (currentStatus === 'adopted') {
      Alert.alert('Already Adopted', `${animal.name || 'This pet'} has already found a forever home!`);
      return;
    }
    
    if (currentStatus === 'owned' && !isOwner) {
      Alert.alert('Not for Adoption', `${animal.name || 'This pet'} is a registered owned pet.`);
      return;
    }

    if (!currentUser || !currentUser.emailVerified) {
      Alert.alert(
        'Verification Required', 
        'Please verify your email address before applying to adopt. Check your Profile tab to resend the link!'
      );
      return;
    }

    setIsModalVisible(true);
  };

  // 🚀 NEW FEATURE: Owner putting pet up for adoption
  const handleOwnerRehome = () => {
    Alert.alert(
      "Put up for Adoption? 🐾",
      `Are you sure you want to list ${animal.name} for adoption? This will make their profile public on the community feed for potential adopters to see.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, List for Adoption", 
          style: "destructive",
          onPress: async () => {
            try {
              const animalRef = doc(db, 'animals', animal.id || animal.animalId);
              // Changing status makes it appear on the Browse feed
              await updateDoc(animalRef, { status: 'sheltered' }); 
              setCurrentStatus('sheltered');
              Alert.alert("Success", `${animal.name} is now listed for adoption.`);
            } catch (error) {
              Alert.alert("Error", "Could not update pet status. Please try again.");
            }
          }
        }
      ]
    );
  };

  const submitApplication = async () => {
    if (!message.trim()) {
      Alert.alert('Missing Info', 'Please add a brief message about why you want to adopt.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'adoptionRequests'), {
        animalId: animal.id || animal.animalId,
        animalName: animal.name || 'Unnamed Pet',
        animalSCID: animal.animalId || 'No ID',
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Unknown User',
        userEmail: currentUser.email,
        livingSituation,
        experience,
        message,
        status: 'pending',
        createdAt: new Date(),
      });

      setIsModalVisible(false);
      setMessage(''); 
      Alert.alert(
        'Application Sent! 🐾', 
        `The sanctuary has received your inquiry for ${animal.name || 'this pet'}. \n\nPlease visit the shelter within the next 48 hours or call them to arrange an interview.`,
        [{ text: 'I will do that!' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const TABS = [
    { id: 'vaccinations', label: 'Vaccines', icon: 'needle' },
    { id: 'medical', label: 'Medical', icon: 'medical-bag' },
    { id: 'shelter', label: 'Shelter', icon: 'home-heart' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* 🌟 FULL-BLEED HERO IMAGE */}
      <View style={styles.heroContainer}>
        {animal.imageUrl ? (
          <Image source={{ uri: animal.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <MaterialCommunityIcons name="paw" size={64} color={COLORS.border} />
          </View>
        )}
        <View style={styles.heroOverlay} />
        
        {/* Transparent Floating Header (Heart Removed) */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🌟 ANIMATED BOTTOM SHEET */}
      <Animated.ScrollView 
        style={[styles.sheetContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.sheetHandle} />

        {/* Header Tags */}
        <View style={styles.badgeRow}>
          <View style={styles.idBadge}>
            <MaterialCommunityIcons name="check-decagram" size={14} color={COLORS.surface} />
            <Text style={styles.idText}>{animal.animalId || 'No ID'}</Text>
          </View>
          {animal.isVerified ? (
            <View style={[styles.statusPill, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.statusPillText, { color: COLORS.greenLight }]}>✓ Verified</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.statusPillText, { color: COLORS.orangeShine }]}>Unverified</Text>
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusPillText, { color: sc.text }]}>
              {currentStatus}
            </Text>
          </View>
        </View>

        {/* Title Block */}
        <Text style={styles.animalName}>{animal.name || 'Unnamed Pet'}</Text>
        <Text style={styles.animalSubtitle}>
          {animal.species} {animal.breed ? `• ${animal.breed}` : ''} • {animal.sex}
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Age', value: animal.age ? `${animal.age} yrs` : 'Unknown', icon: 'calendar-outline' },
            { label: 'Location', value: animal.location || 'Unknown', icon: 'map-marker-outline' },
            { label: 'Status', value: currentStatus || 'Unknown', icon: 'information-outline' },
            { label: 'Health', value: 'Stable', icon: 'heart-pulse' },
          ].map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <View style={styles.statIconBg}>
                <MaterialCommunityIcons name={stat.icon} size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons name={tab.icon} size={16} color={activeTab === tab.id ? COLORS.surface : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'vaccinations' && (
            <View>
              {animal.vaccinations?.length > 0 ? (
                animal.vaccinations.map((v, i) => (
                  <View key={i} style={styles.recordCard}>
                    <View style={[styles.recordIconBox, { backgroundColor: '#E1F5FE' }]}>
                      <MaterialCommunityIcons name="needle" size={24} color={COLORS.blueSea} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle}>{v.vaccine}</Text>
                      <Text style={styles.recordSub}>By {v.givenBy || 'Unknown'}</Text>
                    </View>
                    <View style={styles.recordDates}>
                      <Text style={styles.recordDateLabel}>Given</Text>
                      <Text style={styles.recordDateValue}>{v.date}</Text>
                      {v.nextDue && (
                        <>
                          <Text style={[styles.recordDateLabel, { marginTop: 4 }]}>Next Due</Text>
                          <Text style={[styles.recordDateValue, { color: COLORS.orangeShine }]}>{v.nextDue}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTab}>
                  <MaterialCommunityIcons name="needle-off" size={40} color={COLORS.border} />
                  <Text style={styles.emptyTabText}>No vaccination records yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'medical' && (
            <View>
              {animal.medicalHistory?.length > 0 ? (
                animal.medicalHistory.map((m, i) => (
                  <View key={i} style={styles.recordCard}>
                    <View style={[styles.recordIconBox, { backgroundColor: '#FFEBEE' }]}>
                      <MaterialCommunityIcons name="medical-bag" size={24} color={COLORS.pinkRed} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle}>{m.condition}</Text>
                      {m.notes && <Text style={styles.recordSub}>{m.notes}</Text>}
                    </View>
                    <View style={styles.recordDates}>
                      <Text style={styles.recordDateLabel}>Treated</Text>
                      <Text style={styles.recordDateValue}>{m.treatedOn}</Text>
                      {m.treatedBy && (
                        <>
                          <Text style={[styles.recordDateLabel, { marginTop: 4 }]}>By</Text>
                          <Text style={styles.recordDateValue}>{m.treatedBy}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTab}>
                  <MaterialCommunityIcons name="medical-bag" size={40} color={COLORS.border} />
                  <Text style={styles.emptyTabText}>No medical records yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'shelter' && (
            <View>
              {animal.shelter?.name ? (
                <View style={styles.shelterCard}>
                  <View style={[styles.recordIconBox, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialCommunityIcons name="home-heart" size={24} color={COLORS.orangeShine} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shelterName}>{animal.shelter.name}</Text>
                    {animal.shelter.contactNumber && (
                      <Text style={styles.shelterContact}>{animal.shelter.contactNumber}</Text>
                    )}
                  </View>
                  {animal.shelter.contactNumber && (
                    <TouchableOpacity style={styles.callBtn} onPress={handleContact}>
                      <MaterialCommunityIcons name="phone" size={20} color={COLORS.surface} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptyTab}>
                  <MaterialCommunityIcons name="home-outline" size={40} color={COLORS.border} />
                  <Text style={styles.emptyTabText}>No shelter information recorded</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Health Tags */}
        <View style={styles.healthSection}>
          <Text style={styles.sectionTitle}>Tags & Traits</Text>
          <View style={styles.tagRow}>
            {animal.vaccinations?.length > 0 && (
              <View style={[styles.tag, { backgroundColor: '#E8F5E9', borderColor: COLORS.greenLight }]}>
                <Text style={[styles.tagText, { color: COLORS.greenLight }]}>Vaccinated</Text>
              </View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {animal.sex === 'male' ? 'Male' : animal.sex === 'female' ? 'Female' : 'Sex Unknown'}
              </Text>
            </View>
            {animal.isVerified && (
              <View style={[styles.tag, { backgroundColor: '#E1F5FE', borderColor: COLORS.blueSea }]}>
                <Text style={[styles.tagText, { color: COLORS.blueSea }]}>Vet Verified</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* 🌟 FIXED ACTION BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 16, 36) }]}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleContact}>
          <MaterialCommunityIcons name="phone-outline" size={26} color={COLORS.primary} />
        </TouchableOpacity>

        {currentStatus === 'owned' && isOwner ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: COLORS.orangeShine }]} 
            onPress={handleOwnerRehome}
          >
            <MaterialCommunityIcons name="home-export-outline" size={22} color={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Put Up For Adoption</Text>
          </TouchableOpacity>
        ) : currentStatus === 'owned' && !isOwner ? (
          <View style={[styles.primaryBtn, { backgroundColor: 'rgba(0, 52, 89, 0.1)', shadowOpacity: 0 }]}>
            <Text style={[styles.primaryBtnText, { color: COLORS.textMuted }]}>Not for Adoption</Text>
          </View>
        ) : currentStatus === 'lost' ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: COLORS.pinkRed }]} 
            onPress={() => navigation.navigate('SightingMap', { animal: animal })}
          >
            <MaterialCommunityIcons name="run-fast" size={22} color={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>I Found This Pet</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryBtn, currentStatus === 'adopted' && { backgroundColor: 'rgba(0, 52, 89, 0.1)', shadowOpacity: 0 }]} 
            onPress={handleAdoptPress}
            disabled={currentStatus === 'adopted'}
          >
            <Text style={[styles.primaryBtnText, currentStatus === 'adopted' && { color: COLORS.textMuted }]}>
              {currentStatus === 'adopted' ? 'Already Adopted' : `Adopt ${animal.name || 'This Pet'}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🌟 ADOPTION MODAL */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adoption Inquiry</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>Tell us a bit about yourself so the sanctuary can process your application for {animal.name || 'this companion'}.</Text>

              <Text style={styles.inputLabel}>Living Situation</Text>
              <View style={styles.pillRow}>
                {['Apartment', 'House', 'Estate/Farm'].map(opt => (
                  <TouchableOpacity 
                    key={opt} 
                    style={[styles.pill, livingSituation === opt && styles.pillActive]}
                    onPress={() => setLivingSituation(opt)}
                  >
                    <Text style={[styles.pillText, livingSituation === opt && styles.pillTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Pet Experience</Text>
              <View style={styles.pillRow}>
                {['First-time owner', 'Have had pets', 'Experienced rescuer'].map(opt => (
                  <TouchableOpacity 
                    key={opt} 
                    style={[styles.pill, experience === opt && styles.pillActive]}
                    onPress={() => setExperience(opt)}
                  >
                    <Text style={[styles.pillText, experience === opt && styles.pillTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Why {animal.name || 'this pet'}?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share a little about why you'd be a great match..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={[styles.submitAppBtn, submitting && { opacity: 0.7 }]} 
                onPress={submitApplication}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <>
                    <Text style={styles.submitAppText}>Send Application</Text>
                    <MaterialCommunityIcons name="send" size={20} color={COLORS.surface} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Hero Section
  heroContainer: { width: '100%', height: 350, position: 'absolute', top: 0, left: 0 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  // Floating Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  
  // Animated Sheet
  sheetContainer: { flex: 1, marginTop: 280, backgroundColor: COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(0, 52, 89, 0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  
  // Title & Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  idBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  idText: { color: COLORS.surface, fontSize: 11, fontWeight: '800' },
  statusPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  animalName: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: -1, marginBottom: 6 },
  animalSubtitle: { fontSize: 16, color: COLORS.textMuted, marginBottom: 24, fontWeight: '600', textTransform: 'capitalize' },
  
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  statIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, textTransform: 'capitalize' },
  
  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, padding: 6, gap: 6, borderWidth: 1, borderColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  tabBtnActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.surface },
  tabContent: { marginTop: 24 },
  
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 16, letterSpacing: -0.5 },
  
  // Records
  recordCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
  recordIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  recordTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  recordSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  recordDates: { alignItems: 'flex-end' },
  recordDateLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  recordDateValue: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTabText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  
  shelterCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  shelterName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  shelterContact: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  callBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  
  // Tags
  healthSection: { marginTop: 32 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: 12, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // 🚀 FIXED Action Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  secondaryBtn: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  primaryBtn: { flex: 1, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: COLORS.surface, letterSpacing: -0.3 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,23,31,0.6)' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  modalCloseBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, lineHeight: 22, fontWeight: '500' },
  inputLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginBottom: 12, marginTop: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  pillTextActive: { color: COLORS.surface },
  textArea: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, fontSize: 14, color: COLORS.textDark, minHeight: 120, borderWidth: 1, borderColor: COLORS.border, marginBottom: 32, fontWeight: '500' },
  submitAppBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitAppText: { color: COLORS.surface, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
});