import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const COLORS = {
  primary: '#154212',
  primaryFixed: '#bcf0ae',
  background: '#faf9f6',
  surfaceContainerLow: '#f4f3f1',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#42493e',
  outlineVariant: '#c2c9bb',
  amber: '#d97706',
  blue: '#2563eb',
  error: '#ba1a1a',
};

const statusStyle = (status) => {
  switch (status) {
    case 'resolved':    return { bg: '#bcf0ae', text: '#002201', label: 'Resolved' };
    case 'reviewing':   return { bg: '#dbe1ff', text: '#003ea8', label: 'Under Review' };
    default:            return { bg: '#fef3c7', text: '#d97706', label: 'Pending' };
  }
};

const RESOURCES = [
  { icon: 'office-building-outline', label: 'Welfare Organizations' },
  { icon: 'alert-circle-outline',    label: 'Emergency Contacts' },
  { icon: 'cog-outline',             label: 'Account Settings' },
];

export default function ProfileScreen() {
  const [reports, setReports] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);

  useEffect(() => {
    // Fetch recent reports from mobile
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );
    const unsubReports = onSnapshot(reportsQuery, (snap) => {
      setReports(snap.docs.slice(0, 5).map(d => ({ ...d.data(), id: d.id })));
    });

    // Count total animals registered
    const animalsQuery = query(collection(db, 'animals'));
    const unsubAnimals = onSnapshot(animalsQuery, (snap) => {
      setAnimalCount(snap.size);
    });

    return () => { unsubReports(); unsubAnimals(); };
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleResource = (label) => {
    Alert.alert(label, 'This section is coming soon.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="paw" size={22} color={COLORS.primary} />
        <Text style={styles.headerTitle}>StrayConnect</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
            </View>
            <View style={styles.verifiedDot}>
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.userName}>Community Member</Text>
          <Text style={styles.userEmail}>strayconnect.lk</Text>

          <View style={[styles.badge]}>
            <MaterialCommunityIcons name="star-circle" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>Local Hero</Text>
          </View>

          {/* Impact Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{reports.length}</Text>
              <Text style={styles.statLabel}>Reports Made</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{animalCount}</Text>
              <Text style={styles.statLabel}>Animals in DB</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Events Joined</Text>
            </View>
          </View>
        </View>

        {/* Recent Reports */}
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
                    name={
                      report.incidentType === 'Lost' ? 'map-search-outline' :
                      report.incidentType === 'Abuse' ? 'alert-outline' :
                      'paw-outline'
                    }
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportTitle}>
                    {report.incidentType || 'Found'} {report.animalType || 'Animal'}
                  </Text>
                  <Text style={styles.reportMeta}>
                    {report.location || 'Unknown location'}
                  </Text>
                  <Text style={styles.reportDate}>
                    {report.createdAt?.toDate
                      ? report.createdAt.toDate().toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      : 'Recently'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Resources */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Resources</Text>
        <View style={styles.resourcesCard}>
          {RESOURCES.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.resourceRow,
                index < RESOURCES.length - 1 && styles.resourceBorder
              ]}
              onPress={() => handleResource(item.label)}
              activeOpacity={0.7}
            >
              <View style={styles.resourceLeft}>
                <MaterialCommunityIcons name={item.icon} size={20} color={COLORS.onSurfaceVariant} />
                <Text style={styles.resourceLabel}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color={COLORS.onSurfaceVariant} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>StrayConnect Sri Lanka · 2024</Text>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Profile
  profileSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: '#bcf0ae',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#42493e',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#bcf0ae',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#154212',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#c2c9bb',
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#154212',
  },
  statLabel: {
    fontSize: 11,
    color: '#42493e',
    textAlign: 'center',
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#154212',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Reports
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  reportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#bcf0ae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c1a',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  reportMeta: {
    fontSize: 12,
    color: '#42493e',
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 11,
    color: '#72796e',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#42493e',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#72796e',
  },

  // Resources
  resourcesCard: {
    backgroundColor: '#f4f3f1',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  resourceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194,201,187,0.4)',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resourceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1c1a',
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e9e8e5',
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#42493e',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#c2c9bb',
    letterSpacing: 0.5,
  },
});