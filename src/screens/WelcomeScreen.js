import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, fonts, frame, hardShadow } from '../design/theme';
import ArcadeButton from '../components/ArcadeButton';
import CompanionAvatar from '../components/CompanionAvatar';
import { COMPANIONS } from '../components/companionScene';

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(0);
  const companion = COMPANIONS[selected];
  return <View style={styles.screen}>
    <StatusBar barStyle="dark-content" />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.brand}><Text style={styles.logo}>STRAY{'\n'}CONNECT</Text><Text style={styles.tag}>CARE.{'\n'}CONNECT.{'\n'}REPEAT.</Text></View>
      <Pressable accessibilityRole="button"
        accessibilityLabel={`${companion.name}, ${companion.id}. ${companion.mood}. Companion ${selected + 1} of ${COMPANIONS.length}`}
        accessibilityHint="Tap to meet the next companion"
        onPress={() => setSelected(value => (value + 1) % COMPANIONS.length)}
        style={({ pressed }) => [styles.console, { backgroundColor: companion.color }, pressed && styles.consolePressed]}>
        <View style={styles.consoleHeader}><Text style={styles.kicker}>MEET YOUR HAPPY PLACE</Text><Text style={styles.player}>{String(selected + 1).padStart(2, '0')} / 04</Text></View>
        <View style={styles.stage}><CompanionAvatar size={230} selected={selected} /></View>
        <View style={styles.identity}><Text style={styles.petName}>{companion.name}</Text><Text style={styles.mood}>{companion.mood}</Text></View>
        <View style={styles.consoleFooter}>
          <Text style={styles.kicker}>TAP TO MEET A FRIEND →</Text>
          <View style={styles.dots}>{COMPANIONS.map((pet, index) => <View key={pet.id} style={[styles.dot, index === selected && styles.dotActive]} />)}</View>
        </View>
      </Pressable>
      <Text style={styles.title}>SMALL PAWS.{'\n'}BIG MISSION.</Text>
      <Text style={styles.description}>Every stray deserves a safe place. Find a friend, report an animal in need, and make care count.</Text>
      <ArcadeButton color={palette.pink} onPress={() => navigation.navigate('Signup')}>LET'S GET STARTED →</ArcadeButton>
      <ArcadeButton color={palette.paper} onPress={() => navigation.navigate('Login')}>LOG IN</ArcadeButton>
      <Text style={styles.footer}>SRI LANKA'S ANIMAL RESCUE COMMUNITY</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.yellow },
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 18 },
  brand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logo: { fontFamily: fonts.title, fontSize: 22, lineHeight: 25, color: palette.ink },
  tag: { fontFamily: fonts.bold, fontSize: 9, textAlign: 'right', lineHeight: 14 },
  console: { ...frame, ...hardShadow, backgroundColor: palette.mint },
  consolePressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '2px 2px 0px 0px #111111' },
  consoleHeader: { borderBottomWidth: 3, borderColor: palette.ink, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: fonts.pixel, fontSize: 10, flexShrink: 1, color: palette.ink },
  stage: { justifyContent: 'center', alignItems: 'center', height: 230 },
  identity: { alignItems: 'center', paddingBottom: 14, gap: 2 },
  petName: { fontFamily: fonts.title, fontSize: 18, color: palette.ink },
  mood: { fontFamily: fonts.body, fontSize: 12, color: palette.ink },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderWidth: 1.5, borderColor: palette.ink },
  dotActive: { backgroundColor: palette.ink },
  consoleFooter: { borderTopWidth: 3, borderColor: palette.ink, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.paper },
  player: { fontFamily: fonts.title, fontSize: 15 },
  title: { fontFamily: fonts.title, fontSize: 27, lineHeight: 34, marginTop: 8, color: palette.ink },
  description: { fontFamily: fonts.body, fontSize: 13, lineHeight: 21, color: palette.ink },
  footer: { fontFamily: fonts.pixel, fontSize: 9, textAlign: 'center', marginTop: 5, color: palette.ink },
});
