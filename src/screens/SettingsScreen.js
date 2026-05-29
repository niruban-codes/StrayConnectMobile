// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const COLORS = {
  primary: '#003459',
  background: '#F7DBA7',
  surface: '#FFFFFF',
  textDark: '#00171F',
  pinkRed: '#FF564F',
};

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <Image source={require('../../assets/images/app-bg.png')} style={styles.bgPattern} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.pinkRed} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  bgPattern: { position: 'absolute', width: '100%', height: '100%', opacity: 0.15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 80 },
  headerTitle: { fontFamily: 'Poppins_900Black', fontSize: 20, color: COLORS.primary },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12 },
  content: { padding: 20 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFEBEE' },
  signOutText: { fontFamily: 'Urbanist_800ExtraBold', fontSize: 16, color: COLORS.pinkRed },
});