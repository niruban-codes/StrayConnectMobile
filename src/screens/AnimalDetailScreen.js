import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, StatusBar,
  Linking, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#154212',
  primaryContainer: '#2d5a27',
  primaryFixed: '#bcf0ae',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  blue: '#2563eb',
  amber: '#d97706',
  error: '#ba1a1a',
};

const statusStyle = (status) => {
  switch (status) {
    case 'adopted':   return { bg: '#bcf0ae', text: '#002201' };
    case 'sheltered': return { bg: '#ccebc7', text: '#506b4f' };
    default:          return { bg: '#ffddb2', text: '#624000' };
  }
};

export default function AnimalDetailScreen({ route, navigation }) {
  const { animal } = route.params;
  const [activeTab, setActiveTab] = useState('vaccinations');
  const sc = statusStyle(animal.status);

  const handleContact = () => {
    if (animal.shelter?.contactNumber) {
      Linking.openURL(`tel:${animal.shelter.contactNumber}`);
    } else {
      Alert.alert('No contact', 'No shelter contact number available for this animal.');
    }
  };

  const TABS = [
    { id: 'vaccinations', label: 'Vaccinations', icon: 'needle' },
    { id: 'medical', label: 'Medical', icon: 'medical-bag' },
    { id: 'shelter', label: 'Shelter', icon: 'home-heart' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Animal Profile</Text>
        <TouchableOpacity style={styles.backBtn}>
          <MaterialCommunityIcons name="heart-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Photo */}
        <View style={styles.heroContainer}>
          {animal.imageUrl ? (
            <Image source={{ uri: animal.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <MaterialCommunityIcons name="paw-outline" size={64} color={COLORS.outlineVariant} />
            </View>
          )}
          {/* Gradient overlay hint */}
          <View style={styles.heroOverlay} />
        </View>

        {/* Floating ID Card */}
        <View style={styles.floatingCard}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.idBadge}>
              <MaterialCommunityIcons name="check-decagram" size={12} color={COLORS.blue} />
              <Text style={styles.idText}>{animal.animalId || 'No ID'}</Text>
            </View>
            {animal.isVerified ? (
              <View style={[styles.statusPill, { backgroundColor: COLORS.primaryFixed }]}>
                <Text style={[styles.statusPillText, { color: '#002201' }]}>✓ Verified</Text>
              </View>
            ) : (
              <View style={[styles.statusPill, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.statusPillText, { color: COLORS.amber }]}>Unverified</Text>
              </View>
            )}
            <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusPillText, { color: sc.text, textTransform: 'capitalize' }]}>
                {animal.status}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.animalName}>{animal.name}</Text>
          <Text style={styles.animalSubtitle}>
            {animal.species} {animal.breed ? `· ${animal.breed}` : ''} · {animal.sex}
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Age', value: animal.age ? `${animal.age} yrs` : 'Unknown', icon: 'calendar-outline' },
              { label: 'Location', value: animal.location || 'Unknown', icon: 'map-marker-outline' },
              { label: 'Status', value: animal.status || 'Unknown', icon: 'information-outline' },
              { label: 'Health', value: 'Stable', icon: 'heart-pulse' },
            ].map(stat => (
              <View key={stat.label} style={styles.statBox}>
                <MaterialCommunityIcons name={stat.icon} size={16} color={COLORS.primary} />
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? COLORS.primary : COLORS.outlineVariant}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>

          {/* Vaccinations */}
          {activeTab === 'vaccinations' && (
            <View>
              <Text style={styles.sectionTitle}>💉 Immunization Records</Text>
              {animal.vaccinations?.length > 0 ? (
                animal.vaccinations.map((v, i) => (
                  <View key={i} style={styles.recordCard}>
                    <View style={styles.recordIconBox}>
                      <MaterialCommunityIcons name="needle" size={20} color={COLORS.primary} />
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
                          <Text style={[styles.recordDateValue, { color: COLORS.amber }]}>{v.nextDue}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTab}>
                  <MaterialCommunityIcons name="needle-off" size={36} color={COLORS.outlineVariant} />
                  <Text style={styles.emptyTabText}>No vaccination records yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Medical */}
          {activeTab === 'medical' && (
            <View>
              <Text style={styles.sectionTitle}>🏥 Clinical Observations</Text>
              {animal.medicalHistory?.length > 0 ? (
                animal.medicalHistory.map((m, i) => (
                  <View key={i} style={styles.recordCard}>
                    <View style={[styles.recordIconBox, { backgroundColor: '#ffdad6' }]}>
                      <MaterialCommunityIcons name="medical-bag" size={20} color={COLORS.error} />
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
                  <MaterialCommunityIcons name="medical-bag" size={36} color={COLORS.outlineVariant} />
                  <Text style={styles.emptyTabText}>No medical records yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Shelter */}
          {activeTab === 'shelter' && (
            <View>
              <Text style={styles.sectionTitle}>🏠 Shelter Information</Text>
              {animal.shelter?.name ? (
                <View>
                  <View style={styles.shelterCard}>
                    <MaterialCommunityIcons name="home-heart" size={20} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shelterName}>{animal.shelter.name}</Text>
                      {animal.shelter.contactNumber && (
                        <Text style={styles.shelterContact}>{animal.shelter.contactNumber}</Text>
                      )}
                    </View>
                    {animal.shelter.contactNumber && (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={handleContact}
                      >
                        <MaterialCommunityIcons name="phone" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyTab}>
                  <MaterialCommunityIcons name="home-outline" size={36} color={COLORS.outlineVariant} />
                  <Text style={styles.emptyTabText}>No shelter information recorded</Text>
                </View>
              )}
            </View>
          )}

        </View>

        {/* Health Tags */}
        <View style={styles.healthSection}>
          <Text style={styles.sectionTitle}>🏷️ Health Tags</Text>
          <View style={styles.tagRow}>
            {animal.vaccinations?.length > 0 && (
              <View style={styles.tag}>
                <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.primary} />
                <Text style={styles.tagText}>Vaccinated</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: '#f4f3f1' }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={[styles.tagText, { color: COLORS.onSurfaceVariant }]}>
                {animal.sex === 'male' ? 'Male' : animal.sex === 'female' ? 'Female' : 'Sex Unknown'}
              </Text>
            </View>
            {animal.isVerified && (
              <View style={[styles.tag, { backgroundColor: '#dbe1ff' }]}>
                <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.blue} />
                <Text style={[styles.tagText, { color: COLORS.blue }]}>Vet Verified</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleContact}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
          <Text style={styles.secondaryBtnText}>Contact Shelter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>
            {animal.status === 'adopted' ? '✓ Adopted' : `Adopt ${animal.name}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf9f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(250,249,246,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194,201,187,0.3)',
  },
  backBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#154212',
  },
  scroll: { flex: 1 },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#efeeeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  floatingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: -28,
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  animalName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  animalSubtitle: {
    fontSize: 15,
    color: '#42493e',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f4f3f1',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#42493e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c1a',
    textTransform: 'capitalize',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#f4f3f1',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#72796e',
  },
  tabTextActive: {
    color: '#154212',
    fontWeight: '700',
  },
  tabContent: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#154212',
    marginBottom: 12,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(194,201,187,0.2)',
  },
  recordIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#bcf0ae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c1a',
    marginBottom: 2,
  },
  recordSub: {
    fontSize: 12,
    color: '#42493e',
  },
  recordDates: {
    alignItems: 'flex-end',
  },
  recordDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#42493e',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  recordDateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1c1a',
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTabText: {
    fontSize: 14,
    color: '#72796e',
    textAlign: 'center',
  },
  shelterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f4f3f1',
    borderRadius: 16,
    padding: 16,
  },
  shelterName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1c1a',
  },
  shelterContact: {
    fontSize: 13,
    color: '#42493e',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#154212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#bcf0ae',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#154212',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(250,249,246,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(194,201,187,0.3)',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#154212',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#154212',
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#154212',
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});